"use strict";
var sequelize = require('sequelize');
var enforcementActionTypes = require('./enforcementActionTypes.js');
var Models = require('./models')


Models.init().then(function() {
  Models.initializeUsnGenerator()
  enforcementActionTypes.forEach(function(name) {
    var enforcementActionType = Models.EnforcementActionType.build({name: name});
    enforcementActionType.save().done(function(e) {
      console.log(e);
    })
  });
});
