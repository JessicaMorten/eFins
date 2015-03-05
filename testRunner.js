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

if (process.env.CIRCLECI) {
  var reporter = require('nodeunit').reporters.default;
} else {
  var reporter = require('nodeunit').reporters.junit;
}

var Models = require('./models');

Models.sequelize.sync({force: true})
  .done(function() {
    process.chdir(__dirname);
    reporter.run(files, {output: "./test-results"}, function() {
      Models.sequelize.close();
    });
  });


