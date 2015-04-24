"use strict";

module.exports = function(sequelize, DataTypes) {
  var RegulatoryCode = sequelize.define("RegulatoryCode", {
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
        this.hasMany(models.EnforcementActionTaken, {as: 'enforcementActionsTaken'});
      }
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return RegulatoryCode;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/regulatorycode', '/regulatorycode/:id'],
      actions: ['list']
    },
    customizationFunction: function(rcodes) {
      rcodes.use({});
      return;
    }
  });
}
