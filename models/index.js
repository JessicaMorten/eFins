"use strict";

var Promise = require('bluebird')
var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var usnGenerator = require('../helpers/usnGenerator')
var basename  = path.basename(module.filename);
if (process.env.NODE_ENV == 'test') {
    pgConn = process.env.EFINS_TEST_DB || 
      "postgres://localhost:5432/efins-test"
  } else {
    pgConn = process.env.EFINS_DB || 
      "postgres://localhost:5432/efins"
  }
var sequelize = new Sequelize(pgConn, {logging: false});
var db        = {};
var epilogueCreatorFunctions = [];
var _allSequencedModelDefinitions = [];

var pgConn;
var inited = false;

Promise.promisifyAll(fs)

var _setupUsnHooks = function(modeldef) {
  return modeldef.describe()
  .then(function (descHash) {
    if((! descHash.usn) && (modeldef.name != "Session")) {
      throw new Error("Model definition for " + modeldef.name + " does not contain a USN property.  Define one." + JSON.stringify(descHash, null, 4))
    }
    if (modeldef.name === "Session") {
      return false
    } else {
      return true
    }
  }).then( function ( shouldApply ) {
    //Set up hooks here
    if(shouldApply) {
      usnGenerator.setupHooks(modeldef);
      // **************** TE<P TEST REMOVE ME!!!! ***************
      if(modeldef.name === "User") {
        // END REMOVE
        _allSequencedModelDefinitions.push(modeldef);
      }
    }
    return modeldef
  })
}

db.init = function() {
  return(fs.readdirAsync(__dirname)
    .filter(function(file) {
      return (file.indexOf(".") !== 0) && (file !== basename);
    })
    .map(function(file) {
      var model = sequelize["import"](path.join(__dirname, file));
      db[model.name] = model;
      return model;
    }).map(function(model) {
      if ("associate" in model) {
        model.associate(db) 
      }
      return model
    }).then(function(models) {
      return sequelize.sync().then(function(){ return models})
    })
    .map(function(model) {
      if ("apiSetup" in model) {
        var hash = model.apiSetup();
        hash.configHash.model = model;
        epilogueCreatorFunctions.push( hash );
      }
      return model
    })
    .map( _setupUsnHooks )
    .then( function() {
      sequelize.sync()
    })
  )
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.createRestApis = function(epilogue) {
  epilogueCreatorFunctions.forEach(function(descriptorHash) {
    var epiResource = epilogue.resource( descriptorHash.configHash );
    descriptorHash.customizationFunction( epiResource );
  });
};

db.initializeUsnGenerator = function() {
  return usnGenerator.initialize(db.sequelize);
};

db.allSequencedModelDefinitions = function() {
  return _allSequencedModelDefinitions;
}

  

module.exports = db;
