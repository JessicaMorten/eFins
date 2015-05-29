"use strict";
var sequelize = require('sequelize');
var vesselTypes = require('./vesselTypes.js');
var Models = require('./models')


Models.init().then(function() {
  Models.initializeUsnGenerator()
  vesselTypes.forEach(function(name) {
    var vessel = Models.VesselType.build({name: name});
    vessel.save().done(function(e) {
      console.log(e);
    })
  });
});
