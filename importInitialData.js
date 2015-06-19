"use strict";
var sequelize = require('sequelize');
var Models = require('./models');
var Promise = require('bluebird');

function makeRecord(name) {
  return {name: name};
}

var data = {
  'EnforcementActionType': require('./initialData/enforcementActionTypes.js').map(makeRecord),
  'Fishery': require('./initialData/fisheries.js').map(makeRecord),
  'Port': require('./initialData/ports').map(makeRecord),
  'Species': require('./initialData/species').map(makeRecord),
  'VesselType': require('./initialData/vesselTypes').map(makeRecord)
}

Models.init().then(function() {
  Models.initializeUsnGenerator().then(function() {
    console.log("importing all", Object.keys(data));
    Promise.map(Object.keys(data), function(k){
      return Promise.map(data[k], function(r){
        console.log('creating', r);
        return Models[k].build(r).save();
      });
    }).then(function(){
      process.exit();
    });    
  })
});
