"use strict";

module.exports = function(sequelize, DataTypes) {
  var EnforcementActionType = sequelize.define("EnforcementActionType", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
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
        this.hasMany(models.EnforcementActionTaken, {as: 'actionsTaken'});
      }
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return EnforcementActionType;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/enforcementactiontype', '/enforcementactiontype/:id'],
      actions: ['list']
    },
    customizationFunction: function(types) {
      types.use({});
      return;
    }
  });
}

