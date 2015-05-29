"use strict";
var sequelize = require('sequelize');
var speciesList = require('./species.js');
var Models = require('./models')

// console.log(species);

Models.init().then(function() {
  Models.initializeUsnGenerator()
  speciesList.forEach(function(name) {
    var spp = Models.Species.build({name: name});
    console.log(spp);
    spp.save().done(function(e) {
      console.log(e);
    })
  });
});
