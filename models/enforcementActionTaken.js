"use strict";

module.exports = function(sequelize, DataTypes) {
  var EnforcementActionTaken = sequelize.define("EnforcementActionTaken", {
    usn: {
      type: DataTypes.BIGINT,
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
        this.belongsTo(models.ViolationType, {through: "EnforcementActionTaken2ViolationType"});
        this.belongsTo(models.RegulatoryCode, {as: 'code', through: "EnforcementActionTaken2RegulatoryCode"})
        this.belongsTo(models.EnforcementActionType, {through: "EnforcementActionTaken2EnforcementActionType"})
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

