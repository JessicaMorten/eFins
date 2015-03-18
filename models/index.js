"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var usnGenerator = require('../helpers/usnGenerator')
var basename  = path.basename(module.filename);

var pgConn;

var _setupUsnHooks = function(modeldef) {
  modeldef.describe().then(function (descHash) {
    if(! descHash.usn && (modeldef.name != "Session")) {
      console.log(descHash)
      throw new Error("Model definition for " + modeldef.name + " does not contain a USN property.  Define one.")
    }
  }).then( function () {
    //Set up hooks here
    usnGenerator.setupHooks(modeldef);

  })
}

/* istanbul ignore else */
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

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf(".") !== 0) && (file !== basename);
  })
  .forEach(function(file) {
    var model = sequelize["import"](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  /* istanbul ignore next */
  if ("associate" in db[modelName]) {
    db[modelName].associate(db);
  }
  if ("apiSetup" in db[modelName]) {
    var hash = db[modelName].apiSetup();
    hash.configHash.model = db[modelName];
    epilogueCreatorFunctions.push( hash );
  }

  _setupUsnHooks(db[modelName]);
  db[modelName].sync()
});

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

  

module.exports = db;
