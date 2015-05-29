"use strict";
var sequelize = require('sequelize');
var request = require('request');

var Models = require('./models');
var species = [];


request("http://pacfin.psmfc.org/pacfin_pub/data_rpts_pub/code_lists/sp.txt", function(err, response, body) {
  if (err) {
    console.log(error);
    process.exit(1);
  } else {
    var rows = body.split("\n");
    species = rows.slice(9, rows.length - 4).map(function(r){return r.substring("Type SPID ".length, 41).trim();}).filter(function(name){return name.indexOf("__") != 0});
    console.log(JSON.stringify(species, null, 2));
    process.exit(0);
  }
});