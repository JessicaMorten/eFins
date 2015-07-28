"use strict";
var im = require('istanbul-middleware');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ResAjax = require('./helpers/resajax');
var epilogue = require('epilogue')
var sequelize = require('sequelize')
var usnGenerator = require('./helpers/usnGenerator')

if (process.env.NODE_ENV === 'test') {
    console.log('Hook loader for coverage - ensure this is not production!');
    im.hookLoader(__dirname);
}

console.log = function() {
  var util = require('util')
  var str =  new Date().toUTCString()
  process.stdout.write(str + ' ' + util.format.apply(this, arguments) + '\n')
}

logger.token('app_user', function(req, res) {
  return req.headers['efins-user']
})

logger.token('device_name', function(req, res) {
  return req.headers['device-name']
})

logger.token('device_id', function(req, res) {
  return req.headers['device-id']
})

logger.token('app_version', function(req, res) {
  return req.headers['user-agent'].split(/eFins\ /)[1]
})

var Models = require('./models');

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
epilogue.initialize({
  app: app,
  sequelize: Models.sequelize,
  base: '/api/1/rest',
  updateMethod: 'PUT'
})

//var decompress = require('express-decompress').create()


Models.init().then(function() {
  Models.createRestApis(epilogue)
  Models.initializeUsnGenerator()
    // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'hjs');

  // uncomment after placing your favicon in /public
  //app.use(favicon(__dirname + '/public/favicon.ico'));
  //When you just want to see what is in the headers, uncomment this and shout for joy
  // app.use(function(req, res, next) {
  //   console.log(req.headers)
  //   next()
  // })
  
  app.use(logger(':date[clf] :remote-addr ":method :url HTTP/:http-version" :status :res[content-length] :app_user [:device_name] [:device_id] :app_version'));
  app.use(bodyParser.json());
  app.use(bodyParser.text());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  


  app.enable('trust proxy', 'loopback');

  if (process.env.NODE_ENV === 'test') {
      //enable coverage endpoints under /coverage
      app.use('/coverage', im.createHandler());
  }
  var routes = require('./routes/index');
  var auth = require('./routes/auth');
  var sync = require('./routes/sync');   
  app.use('/auth', auth)
  app.use('/ping', function(req, res) {
    res.send("OK")
  })
  app.use(passport.authorize('token', {session: false}));
  app.use('/', routes);
  app.use('/api/1', sync)

  

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
      console.log('handled error', err);
      if (err instanceof sequelize.ValidationError) {
        err.message = "Validation Error: ";
        err.message += err.errors.map(
          function(e){return e.message;}).join(', ');
        err.status = 400
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
});

module.exports = app;
