var emailer = require('../email');
var MailClient = require('sendgrid-stub').MailClient;
var mailClient = new MailClient("./sendgridEmails/");
var request = require('request');
var absUrl = require('../absoluteUrl')
var cheerio = require('cheerio');
var User = require('../models').User;

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

exports.setUp = function(done) {
  require('../models').sequelize.sync({force: true}).done(done);
}


