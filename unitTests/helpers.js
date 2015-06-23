var Models = require('../models');
var User = Models.User;
var request = require('request');
var absUrl = require('../absoluteUrl')

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
              email: opts.email || "test@example.com",
              password: opts.password || "password"
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

function createActivityTestFixture() {
  // creates an activity (cdfwCommercialBoardingCard) 
  // with all possible associations set for test purposes
}


module.exports = {
  helpers: function(test) {
    if (test && test.done) { test.done() };
    return {
      authorize: authorize,
      createUser: createUser,
      createActivityTestFixture: createActivityTestFixture
    }
  }
}