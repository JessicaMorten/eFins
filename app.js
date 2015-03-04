"use strict";
var im = require('istanbul-middleware');

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sequelize = require('sequelize');

if (process.env.NODE_ENV === 'test') {
    console.log('Hook loader for coverage - ensure this is not production!');
    im.hookLoader(__dirname);
}

var Models = require('./models');

var routes = require('./routes/index');
var auth = require('./routes/auth');
      
var absUrl = require('./absoluteUrl.js');

// Authorization
var passport = require('passport');
var BearerStrategy = require('passport-http-bearer').Strategy;
var jwt = require('jsonwebtoken');

passport.use('token', new BearerStrategy(
  function(token, done) {
    jwt.verify(token, Models.Session.SECRET, function(err, decoded) {
      if (err) {
        done(null, false);
      } else {
        Models.Session.findOne({where: {token: token}})
        .done(function(err, session) {
          if (err) {
            next(err);
          } else {
            if (session) {
              if (decoded.authorized) {
                decoded.token = token;
                done(null, decoded);
              } else {
                done(null, false);
              }
            } else {
              done(null, false);
            }
          }
        });
      }
    });
  }
));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', auth);
if (process.env.NODE_ENV === 'test') {
    //enable coverage endpoints under /coverage
    app.use('/coverage', im.createHandler());
}

app.use(passport.authorize('token', {session: false}));
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    console.log('handled error');
    if (err instanceof sequelize.ValidationError) {
      err.message = "Validation Error: ";
      err.message += err.errors.map(
        function(e){return e.message;}).join(', ');
    }
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  console.log('handled error');
  if (err instanceof sequelize.ValidationError) {
    err.message = "Validation Error: ";
    err.message += err.errors.map(
      function(e){return e.message;}).join(', ');
  }
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err
  });
});

sequelize.Promise.onPossiblyUnhandledRejection(function(err, promise) {
  console.error(err.stack);
  server.close(function() {
    process.exit(1);
  });
});

module.exports = app;
