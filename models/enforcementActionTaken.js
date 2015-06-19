"use strict";
Promise = require('bluebird')

module.exports = function(sequelize, DataTypes) {
  var EnforcementActionTaken = sequelize.define("EnforcementActionTaken", {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    usn: {
      type: DataTypes.INTEGER,
      //allowNull: false,
      // unique: true//,
      // validate: {
      //   notEmpty: true
      // }
    }
  }, {
    classMethods: {
      apiSetup: apiSetup,
      associate: function(models) {
        this.belongsTo(models.ViolationType);
        this.belongsTo(models.EnforcementActionType)
        this.belongsToMany(models.Activity, {through: "Activity2EnforcementActionTaken"});
      }
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return EnforcementActionTaken;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/enforcementactiontaken', '/enforcementactiontaken/:id'],
      actions: ['list']
    },
    customizationFunction: function(takens) {
      takens.use({});
      return;
    }
  });
}

