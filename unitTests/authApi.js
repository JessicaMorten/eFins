var emailer = require('../email');
var MailClient = require('sendgrid-stub').MailClient;
var mailClient = new MailClient("./sendgridEmails/");
var request = require('request');
var absUrl = require('../absoluteUrl')
var cheerio = require('cheerio');
var Models = require('../models');
var User = Models.User;

function inbox(test, next) {
  mailClient.getLatest(function(err, email) {
    test.ifError(err);
    var email = JSON.parse(email);
    var $ = cheerio.load(email.html);
    next($, email);
  })
}

function userIsAllowed(email, next) {
  User.find({where: {email: email}}).done(function(err, user) {
    next(user.isAllowed());
  });
}

function createUser(opts, next) {
  var password = opts.password;
  delete opts.password;
  var user = User.build(opts);
  user.setPassword(password, function(err){
    /* istanbul ignore if */
    if (err) {
      next(err)
    } else {
      user.save().done(function(err) {
        next(err, user);
      })      
    }
  });
}

exports.setUp = function(done) {

  Models.sequelize.sync({force: true}).done(done);
}

exports.successfulUserRegistrationWorkflow = function(test) {
  request.post(absUrl("/auth/register"), {
    form: {
      name: "Test User",
      email: "test@efins.org",
      password: "password"
    }
  }, function(err, response, body) {
    test.ifError(err);
    test.equals(response.statusCode, 201, "Status code");
    // User should be registered, but not be allowed to use the app until
    // they are approved and have confirmed an email address
    userIsAllowed("test@efins.org", function(allowed) {
      test.ok(!allowed, "User not approved yet");
      inbox(test, function($, email) {
        test.equals(email.to, "admin@efins.org");
        test.ok($('a[rel=approve]').attr('href').length);
        test.ok($('a[rel=deny]').attr('href').length);
        request.get($('a[rel=approve]').attr('href'), 
          function(err, response, body) {
            test.ifError(err);
            test.equals(response.statusCode, 200, "Approved");
            userIsAllowed("test@efins.org", function(allowed) {
              test.ok(!allowed, "User has not confirmed email yet");    
              inbox(test, function($, email) {
                test.ifError(err);
                test.equals(email.to, "test@efins.org");
                test.ok($('[rel=confirm]').attr('href').length);
                request.get($('[rel=confirm]').attr('href'), 
                  function(err, response, body) {
                    test.equals(response.statusCode, 200);
                    userIsAllowed("test@efins.org", function(allowed) {
                      test.ok(allowed, "User should be all registered now");
                      test.done();
                    });
                  });
              });
            });
          });
      })

    });
  });
}

exports.cantRegisterWithoutPassword = function(test) {
    request.post(absUrl("/auth/register"), {
    form: {
      name: "Test User",
      email: "test@efins.org",
      password: ""
    }
  }, function(err, response, body) {
    test.ifError(err);
    test.equals(response.statusCode, 400, "Validation error");
    test.done();
  });
}

exports.cantApproveMissingUsers = function(test) {
  request.get(absUrl("/auth/approve/12345"), 
          function(err, response, body) {
            test.ifError(err);
            test.equals(response.statusCode, 404);
            test.done();
          });
}

exports.cantDenyMissingUsers = function(test) {
  request.get(absUrl("/auth/deny/12345"), 
          function(err, response, body) {
            test.ifError(err);
            test.equals(response.statusCode, 404);
            test.done();
          });
}

exports.cantConfirmMissingUsers = function(test) {
  request.get(absUrl("/auth/emailConfirmation/12345"), 
          function(err, response, body) {
            test.ifError(err);
            test.equals(response.statusCode, 404);
            test.done();
          });
}

exports.resendingEmailConfirmationRequest = function(test) {
  request.post(absUrl("/auth/register"), {
    form: {
      name: "Test User",
      email: "test@efins.org",
      password: "password"
    }
  }, function(err, response, body) {
    test.ifError(err);
    test.equals(response.statusCode, 201, "Status code");
    inbox(test, function($, email) {
      test.equals(email.to, "admin@efins.org");
      test.ok($('a[rel=approve]').attr('href').length);
      request.get($('a[rel=approve]').attr('href'), 
        function(err, response, body) {
          test.ifError(err);
          test.equals(response.statusCode, 200, "Approved");
          // Okay, lets try approving again
          request.get($('a[rel=approve]').attr('href'), 
            function(err, response, body) {
              test.ifError(err);
              test.equals(response.statusCode, 200, "Approved");
              test.ok(body.indexOf('resend'));
              request.get(cheerio.load(body)('a[rel=resend]').attr('href'), 
                function(err, response, body) {
                  test.ifError(err);
                  test.ok(body.indexOf('resent'));
                  test.done();
                });
            });
        });
    });
  });
}

exports.denyingUsers = function(test) {
  request.post(absUrl("/auth/register"), {
    form: {
      name: "Test User",
      email: "test@efins.org",
      password: "password"
    }
  }, function(err, response, body) {
    test.ifError(err);
    test.equals(response.statusCode, 201, "Status code");
    inbox(test, function($, email) {
      test.equals(email.to, "admin@efins.org");
      var approveLink = $('a[rel=approve]').attr('href');
      test.ok($('a[rel=deny]').attr('href').length);
      request.get($('a[rel=deny]').attr('href'), 
        function(err, response, body) {
          test.ifError(err);
          test.equals(response.statusCode, 200, "Deleted");
          User.find({where: {email: "test@efins.org"}}).done(function(err, user) {
            test.ok(!user, "User should be deleted");
            request.get(approveLink, function(err, response, body) {
              test.equals(response.statusCode, 404, "User should be deleted");
              test.done();
            });
          });
        });
    });
  });
}

exports.dontDenyAlreadyAllowedUsers = function(test) {
  request.post(absUrl("/auth/register"), {
    form: {
      name: "Test User",
      email: "test@efins.org",
      password: "password"
    }
  }, function(err, response, body) {
    test.ifError(err);
    test.equals(response.statusCode, 201, "Status code");
    inbox(test, function($, email) {
      test.equals(email.to, "admin@efins.org");
      var denyLink = $('a[rel=deny]').attr('href');
      request.get($('a[rel=approve]').attr('href'), 
        function(err, response, body) {
          test.ifError(err);
          test.equals(response.statusCode, 200, "Approved");
          request.get(denyLink, function(err, response, body) {
            test.equals(response.statusCode, 403, "User already allowed");
            test.done();
          });
        });
    });
  });
}

exports.requireTokenForNearlyEverything = function(test) {
  request.get(absUrl("/vessels"), function(err, response, body) {
    test.ifError(err);
    test.equals(response.statusCode, 401, "Not authorized");
    test.done();
  });
}

exports.getToken = {
  getToken: function(test) {
    createUser({
      email: 'test@example.com',
      name: 'Test User',
      approved: true,
      emailConfirmed: true,
      password: 'password'
    }, function(err, user) {
      test.ifError(err);
      user.save().done(function(err) {
        test.ifError(err);
        request.post(absUrl("/auth/getToken"), {form: {email: "test@example.com", password: "password"}}, function(err, response, body) {
          test.ifError(err);
          test.equals(response.statusCode, 200);
          test.ok(!!response.headers.authorization);
          test.equals(response.headers.authorization.split(' ')[0], "Bearer");
          var authorized = request.defaults({
            headers: {
              Authorization: response.headers.authorization
            }
          });
          authorized.get(absUrl("/"), function(err, res, body) {
            test.ifError(err);
            test.equals(res.statusCode, 200);
            test.done();
          });
        });
      });
    });
  },

  wrongPassword: function(test) {
    createUser({
      email: 'test@example.com',
      name: 'Test User',
      approved: true,
      emailConfirmed: true,
      password: 'password'
    }, function(err, user) {
      test.ifError(err);
      request.post(absUrl("/auth/getToken"), {form: {email: "test@example.com", password: "psswrd"}}, function(err, response, body) {
        test.ifError(err);
        test.equals(response.statusCode, 401);
        test.ok(!response.headers.authorization);
        test.done();
      });
    });  
  },

  missingParams: function(test) {
    createUser({
      email: 'test@example.com',
      name: 'Test User',
      approved: true,
      emailConfirmed: true,
      password: 'password'
    }, function(err, user) {
      test.ifError(err);
      request.post(absUrl("/auth/getToken"), {form: {}}, function(err, response, body) {
        test.ifError(err);
        test.equals(response.statusCode, 400);
        test.ok(!response.headers.authorization);
        test.done();
      });
    });  
  },

  nonExistantUser: function(test) {
    createUser({
      email: 'test@example.com',
      name: 'Test User',
      approved: true,
      emailConfirmed: true,
      password: 'password'
    }, function(err, user) {
      test.ifError(err);
      request.post(absUrl("/auth/getToken"), {form: {email: 'someone@example.com', password: 'password'}}, function(err, response, body) {
        test.ifError(err);
        test.equals(response.statusCode, 404);
        test.ok(!response.headers.authorization);
        test.done();
      });
    });  
  },

  unapproved: function(test) {
    createUser({
      email: 'test@example.com',
      name: 'Test User',
      approved: false,
      emailConfirmed: true,
      password: 'password'
    }, function(err, user) {
      test.ifError(err);
      request.post(absUrl("/auth/getToken"), {form: {email: "test@example.com", password: "password"}}, function(err, response, body) {
        test.ifError(err);
        test.equals(response.statusCode, 403);
        test.ok(!response.headers.authorization);
        test.done();
      });
    });  
  },

  withoutEmailConfirmation: function(test) {
    createUser({
      email: 'test@example.com',
      name: 'Test User',
      approved: true,
      emailConfirmed: false,
      password: 'password'
    }, function(err, user) {
      test.ifError(err);
      request.post(absUrl("/auth/getToken"), {form: {email: "test@example.com", password: "password"}}, function(err, response, body) {
        test.ifError(err);
        test.equals(response.statusCode, 403);
        test.ok(!response.headers.authorization);
        test.done();
      });
    });  
  }
}

function authorize(opts, next) {
  createUser(opts, function(err, user) {
    /* istanbul ignore if */
    if (err) {
      next(err);
    } else {
      user.save().done(function(err) {
        /* istanbul ignore if */
        if (err) {
          next(err);
        } else {
          var form = {
            form: {
              email: "test@example.com",
              password: "password"
            }
          };
          request.post(absUrl("/auth/getToken"), form, function(err, res) {
            /* istanbul ignore if */
            if (err) {
              next(err);
            } else {
              /* istanbul ignore if */
              if (res.statusCode !== 200) {
                next(new Error("Could not get token"));
              } else {
                next(null, user, request.defaults({
                  headers: {
                    Authorization: res.headers.authorization
                  }
                }));
              }
            }
          });          
        }
      });
    }
  });
}

exports.expireToken = {
  successfully: function(test) {
    authorize({
      email: 'test@example.com',
      name: 'Test User',
      approved: true,
      emailConfirmed: true,
      password: 'password'
    }, function(err, user, authorized) {
      test.ifError(err);
      authorized.get(absUrl("/"), function(err, res, body) {
        test.ifError(err);
        test.equals(res.statusCode, 200);
        authorized.post(absUrl("/auth/expireToken"), function(err, res, b) {
          test.ifError(err);
          test.equals(res.statusCode, 200);
          authorized.get(absUrl("/"), function(err, res, body) {
            test.ifError(err);
            test.equals(res.statusCode, 401);
            test.done()
          });
        });
      });
    });
  },

  noToken: function(test) {
    request.post(absUrl("/auth/expireToken"), function(err, res) {
      test.ifError(err);
      test.equals(res.statusCode, 401);
      test.done();
    });
  },

  nonExistentToken: function(test) {
    var authorized = request.defaults({
      headers: {
        Authorization: "Bearer 12345"
      }
    });
    request.post(absUrl("/auth/expireToken"), function(err, res) {
      test.ifError(err);
      test.equals(res.statusCode, 401);
      test.done();
    });
  }
}

exports.passwordReset = {
  noEmail: function(test) {
    createUser({
      email: 'test@example.com',
      name: 'Test User',
      approved: true,
      emailConfirmed: false,
      password: 'password'
    }, function(err, user) {
      test.ifError(err);
      request.post(absUrl("/auth/requestPasswordReset"), function(err, res) {
        test.ifError(err);
        test.equals(res.statusCode, 400);
        test.done();
      });
    });  
  },

  noUser: function(test) {
    createUser({
      email: 'test@example.com',
      name: 'Test User',
      approved: true,
      emailConfirmed: false,
      password: 'password'
    }, function(err, user) {
      test.ifError(err);
      var form = {
        form: {
          email: "nope@example.com"
        }
      };
      request.post(absUrl("/auth/requestPasswordReset"), form, function(err, res) {
        test.ifError(err);
        test.equals(res.statusCode, 404);
        test.done();
      });
    });  
  },

  successful: function(test) {
    createUser({
      email: 'test@example.com',
      name: 'Test User',
      approved: true,
      emailConfirmed: true,
      password: 'password'
    }, function(err, user) {
      test.ifError(err);
      var form = {
        form: {
          email: "test@example.com"
        }
      };
      request.post(absUrl("/auth/requestPasswordReset"), form, function(err, res) {
        test.ifError(err);
        test.equals(res.statusCode, 200);
        inbox(test, function($, email) {
          test.equals(email.to, "test@example.com");
          var link = $('[rel=reset]').attr('href');
          request.get(link, function(err, res, body){
            test.ifError(err);
            test.equals(res.statusCode, 200);
            var $ = cheerio.load(body);
            var postLink = absUrl($('form').attr('action'));
            var form = {form: {password: "test"}};
            request.post(postLink, form, function(err, res, body){
              test.ifError(err);
              test.equals(res.statusCode, 200);
              var form = {
                form: {
                  email: "test@example.com",
                  password: "test"
                }
              };
              request.post(absUrl("/auth/getToken"), form, function(err, res, body) {
                test.ifError(err);
                test.equals(res.statusCode, 200);
                test.done();
              });
            });
          });
        });
      });
    });  
  },

  noPasswordGiven: function(test) {
    createUser({
      email: 'test@example.com',
      name: 'Test User',
      approved: true,
      emailConfirmed: true,
      password: 'password'
    }, function(err, user) {
      test.ifError(err);
      var form = {
        form: {
          email: "test@example.com"
        }
      };
      var url = absUrl("/auth/resetPassword/" + user.secretToken);
      request.post(url, form, function(err, res, body) {
        test.ifError(err);
        test.equals(res.statusCode, 400);
        test.done();
      });
    });
  },

  unknownUser: function(test) {
    var form = {
      form: {
        email: "test@example.com"
      }
    };
    request.post(absUrl("/auth/resetPassword/1234"), form, function(err, res, body) {
      test.ifError(err);
      test.equals(res.statusCode, 404);
      test.done();
    });
  }
}

