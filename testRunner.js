#!/usr/bin/env node
/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
  throw new Error('process.env.NODE_ENV must be "test"!!!');
}
/* istanbul ignore next */
var files = process.argv.slice(2) || ['unitTests'];
/* istanbul ignore else */
if (files.length === 0) {
  files = ['unitTests'];
}


process.env.EFINS_TEST_REPORTER = process.env.EFINS_TEST_REPORTER || "default";
console.log('using', process.env.EFINS_TEST_REPORTER, 'reporter');
var reporter = require('nodeunit').reporters[process.env.EFINS_TEST_REPORTER];

var opts = null;
if (process.env.EFINS_TEST_REPORTER === 'junit') {
  if (process.env.CIRCLE_TEST_REPORTS) {
    opts = {output: process.env.CIRCLE_TEST_REPORTS + "/nodeunit"};
  } else {
    opts = {output: "./test-results"};
  }
}

var Promise = require("bluebird");

Promise.onPossiblyUnhandledRejection(function(error){
  throw error
});

var Models = require('./models');
Models.init()
.then(function() {
  Models.initializeUsnGenerator()
  Models.sequelize.sync({force: true})
    .done(function() {
      process.chdir(__dirname);
      reporter.run(files, opts, function() {
        Models.sequelize.close();
      });
    })
})
