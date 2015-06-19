"use strict";
Promise = require('bluebird')

module.exports = function(sequelize, DataTypes) {
  var Catch = sequelize.define("Catch", {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    amount: {
      type: DataTypes.INTEGER
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
        this.belongsTo(models.Species);
        this.belongsToMany(models.Activity, {through: "Activity2Catch"});
      }
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return Catch;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/catch', '/catch/:id'],
      actions: ['list']
    },
    customizationFunction: function(catches) {
      catches.use({});
      return;
    }
  });
}
