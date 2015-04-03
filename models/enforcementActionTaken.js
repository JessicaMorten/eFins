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
        this.hasOne(models.ViolationType);
        this.hasOne(models.RegulatoryCode, {as: 'code'})
        this.hasOne(models.EnforcementActionType)
        this.belongsToMany(models.Activity);
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

