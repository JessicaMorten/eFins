"use strict";
Promise = require('bluebird')

module.exports = function(sequelize, DataTypes) {
  var Agency = sequelize.define("Agency", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true,
      validate: {
        notEmpty: true
      }
    },
    usn: {
      type: DataTypes.INTEGER,
      //allowNull: false,
      unique: true//,
      // validate: {
      //   notEmpty: true
      // }
    }
  }, {
    classMethods: {
      apiSetup: apiSetup,
      associate: function(models) {
        // associations can be defined here
        models.Agency.hasMany(models.User);
        models.Agency.hasMany(models.AgencyVessel);
      }
    },
    instanceMethods: {
      
    },
    paranoid: true,
    timestamps: true
  });
  return Agency;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/agency', '/agency/:id'],
      actions: ['list']
    },
    customizationFunction: function(agencies) {
      agencies.use({});
      return;
    }
  });
}

