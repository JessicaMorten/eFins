var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Models = require('./models');
var sequelize = require('sequelize');

var routes = require('./routes/index');
var auth = require('./routes/auth');

// Authorization
var passport = require('passport');
BearerStrategy = require('passport-http-bearer').Strategy;
var jwt = require('jsonwebtoken');

if (!process.env.EFINS_SECRET) {
  console.error('EFINS_SECRET not set. This is INSECURE!');
}
var SECRET = process.env.EFINS_SECRET || 'insecure';

passport.use('token', new BearerStrategy(
  function(token, done) {
    jwt.verify(token, SECRET, function(err, decoded) {
      if (err) {
        done(null, false);
      } else {
        if (decoded.authorized) {
          done(null, decoded);
        } else {
          done(null, false);
        }
      }
    });
  }
));

passport.use('w/user', new BearerStrategy(
  function(token, done) {
    jwt.verify(token, SECRET, function(err, decoded) {
      if (err) {
        done(null, false);
      } else {
        var userId = decoded.userId;
        if (userId) {
          Models.User.find(userId).done(done);
        } else {
          done(new Error('No userId present in token'));
        }
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
    if (err instanceof sequelize.ValidationError) {
      err.message = "Validation Error: ";
      err.message += err.errors.map(function(e){return e.message;}).join(', ');
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
  if (err instanceof sequelize.ValidationError) {
    err.message = "Validation Error: ";
    err.message += err.errors.map(function(e){return e.message;}).join(', ');
  }
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err
  });
});


module.exports = app;
