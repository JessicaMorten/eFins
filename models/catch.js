"use strict";

module.exports = function(sequelize, DataTypes) {
  var Catch = sequelize.define("Catch", {
    amount: {
      type: DataTypes.INTEGER
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
        this.belongsTo(models.Species);
        this.hasOne(models.Activity);
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
