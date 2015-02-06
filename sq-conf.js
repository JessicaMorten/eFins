"use strict";
var url = require('url');

var connectionString = process.env.EFINS_DB || 
  "postgress://localhost:5432/efins";

var opts = url.parse(connectionString);

var config = {
  "username": opts.auth ? opts.auth.split(':')[0] : 'postgres',
  "password": opts.auth ? opts.auth.split(':')[1] : null,
  "database": opts.path.split('/')[1],
  "host": opts.host.split(':')[0],
  "port": opts.host.split(':')[1],
  "dialect": "postgres"
};

module.exports = {
  "one-and-only": config
};
