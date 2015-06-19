"use strict";
Promise = require('bluebird')

module.exports = function(sequelize, DataTypes) {
  var ViolationType = sequelize.define("ViolationType", {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING,
      // allowNull: false,
      // // unique: true,
      // validate: {
      //   notEmpty: true
      // }
    },
    code: {
      type: DataTypes.STRING,
      // allowNull: false,
      // validate: {
      //   notEmpty: true
      // }
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
        this.hasMany(models.EnforcementActionTaken, {as: 'actionsTaken'});
      }
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return ViolationType;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/violationtype', '/violationtype/:id'],
      actions: ['list']
    },
    customizationFunction: function(types) {
      types.use({});
      return;
    }
  });
}

