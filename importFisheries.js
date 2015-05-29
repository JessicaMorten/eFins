"use strict";
var sequelize = require('sequelize');
var fisheries = require('./fisheries.js');
var Models = require('./models')


Models.init().then(function() {
  Models.initializeUsnGenerator()
  fisheries.forEach(function(name) {
    var fishery = Models.Fishery.build({name: name});
    fishery.save().done(function(e) {
      console.log(e);
    })
  });
});
