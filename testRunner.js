#!/usr/bin/env node
if (process.env.NODE_ENV !== 'test') {
  throw new Error('process.env.NODE_ENV must be "test"!!!');
}

var files = process.argv.slice(2) || ['unitTests'];
if (files.length === 0) {
  files = ['unitTests'];
}

var reporter = require('nodeunit').reporters.default;

var Models = require('./models');

Models.sequelize.sync({force: true, logging: false})
  .done(function() {
    process.chdir(__dirname);
    reporter.run(files, null, function() {
      Models.sequelize.close();
    });
  });


