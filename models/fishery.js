"use strict";
Promise = require('bluebird')

module.exports = function(sequelize, DataTypes) {
  var Fishery = sequelize.define("Fishery", {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING
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
        this.hasMany(models.Activity);
      }
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return Fishery;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/fishery', '/fishery/:id'],
      actions: ['list']
    },
    customizationFunction: function(fisheries) {
      fisheries.use({});
      return;
    }
  });
}
