"use strict";
var url = require('url');

var connectionString = process.env.EFINS_DB || 
  "postgres://localhost:5432/efins_development";

var opts = url.parse(connectionString);

var config = {
  "username": opts.auth ? opts.auth.split(':')[0] : 'efins',
  "password": opts.auth ? opts.auth.split(':')[1] : '@efins!%',
  "database": opts.path.split('/')[1],
  "host": opts.host.split(':')[0],
  "port": opts.host.split(':')[1],
  "dialect": "postgres"
};

module.exports = {
  "one-and-only": config
};
