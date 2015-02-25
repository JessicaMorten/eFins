var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models').User;

/**
POST /register
Must have the following attributes:
  * name
  * email
  * password
*/
router.post('/register', function(req, res, next) {
  var user = User.build({
    email: req.body.email,
    name: req.body.name,
    approved: false
  });
  if (!req.body.password) {
    var err = new Error("Password required");
    err.status = 400;
    next(err);
  } else {
    user.setPassword(req.body.password, function(err) {
      if (err) {
        next(err);
      } else {
        user.save({logging: false}).done(function(err, user) {
          if (err) {
            err.status = 400;
            next(err);
          } else {
            res.status = 201;
            res.send(
              'User created. Email confirmation will be sent on approval.');
          }
        });
      }
    });
  }
});

router.post('/login', function(req, res) {
  res.send('respond with a resource');
});

router.post('/logout', function(req, res) {
  res.send('respond with a resource');
});

router.get('/', passport.authorize('w/user', {session: false}),
  function(req, res) {
    res.send('user details');
  });

module.exports = router;
