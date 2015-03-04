"use strict";
var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models').User;
var Session = require('../models').Session;
var absUrl = require('../absoluteUrl');
/**
POST /register
Must have the following attributes:
  * name
  * email
  * password
*/
router.post('/register', function(req, res, next) {
  User.register(req.body, function(err, user) {
    if (err) {
      next(err);
    } else {
      res.status(201);
      res.send('User created. Email confirmation will be sent on approval.');
    }
  });
});

// Yep, these should be POST but they are going to be action links
// embedded in an email so they must be GET
router.get('/approve/:token', function(req, res, next) {
  var q = {where: {secretToken: req.params.token}};
  User.find(q).done(function(err, user) {
    /* istanbul ignore if */
    if (err) {
      next(err);
    } else {
      if (user) {
        if (user.approved) {
          if (req.query.resend) {
            user.resendConfirmationEmail(function(err, user) {
              /* istanbul ignore if */
              if (err) {
                next(err);
              } else {
                res.send("Approval email resent.");
              }
            });
          } else {
            var link = absUrl("/auth/approve/", req.params.token,
              "?resend=true");
            res.send(
              "User already approved. <a rel=\"resend\" href=\"" +
                link + "\">Resend link</a>?");
          }
        } else {
          user.approve(function(err, user) {
            /* istanbul ignore if */
            if (err) {
              next(err);
            } else {
              res.send("User has been approved and will recieve an email");
            }
          });          
        }
      } else {
        err = new Error("User does not exist");
        err.status = 404;
        next(err);
      }
    }
  });
});

router.get('/deny/:token', function(req, res, next) {
  var q = {where: {secretToken: req.params.token}};
  User.find(q).done(function(err, user) {
    /* istanbul ignore if */
    if (err) {
      next(err);
    } else {
      if (user) {
        if (user.approved) {
          res.status(403)
          res.send("User was already approved by an administrator");
        } else {
          // send email to admins
          // no need to send to user as they were likely abusive
          user.destroy().done(function(err, user) {
            /* istanbul ignore if */
            if (err) {
              next(err);
            } else {
              res.send("User was denied and deleted from the database");
            }
          });          
        }
      } else {
        err = new Error("User does not exist");
        err.status = 404;
        next(err);
      }
    }
  });
});

router.get('/emailConfirmation/:token', function(req, res, next) {
  var q = {where: {secretToken: req.params.token}};
  User.find(q).done(function(err, user) {
    /* istanbul ignore if */
    if (err) {
      next(err);
    } else {
      if (user) {
        user.emailConfirmed = true;
        user.save().done(function(err, user) {
          /* istanbul ignore if */
          if (err) {
            next(err);
          } else {
            res.render("activated", {openApp: "efins://activate"});
          }
        });
      } else {
        err = new Error("User does not exist");
        err.status = 404;
        next(err);
      }
    }
  });  
});

router.post('/getToken', function(req, res, next) {
  if (!req.body.email) {
    var err = new Error("Email Required");
    err.status = 400;
    next(err);
  } else {
    User.find({where: { email: req.body.email }}).done(function(err, user) {
      if (err) {
        next(err);
      } else {
        if (user) {
          user.verifyPassword(req.body.password, function(err, passes) {
            if (passes) {
              if (user.isAllowed()) {
                Session.createForUser(user, function(err, session) {
                  if (err) {
                    next(err);
                  } else {
                    res.set('Authorization', session.toString());
                    res.send(JSON.stringify(session));
                  }
                });
              } else {
                err = new Error("Account not yet approved.");
                err.status = 403;
                next(err);
              }
            } else {
              err = new Error("Incorrect password");
              err.status = 401;
              next(err);
            }
          });
        } else {
          err = new Error("User does not exist");
          err.status = 404;
          next(err);
        }
      }
    });
  }
});

var check = passport.authorize('token', {session: false});

router.post('/expireToken', check, function(req, res, next) {
  Session.destroy({where: {token: req.account.token}})
    .done(function(err, affected) {
      console.log('err', affected);
      if (err) {
        next(done);
      } else {
        res.send("Deleted");
      }
    });
});

// router.post('/logout', function(req, res) {
//   res.send('respond with a resource');
// });

// router.get('/', passport.authorize('w/user', {session: false}),
//   function(req, res) {
//     res.send('user details');
//   });

module.exports = router;
