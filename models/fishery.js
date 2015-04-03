"use strict";

module.exports = function(sequelize, DataTypes) {
  var Fishery = sequelize.define("Fishery", {
    name: {
      type: DataTypes.STRING
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
        this.belongsToMany(models.Activity);
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
