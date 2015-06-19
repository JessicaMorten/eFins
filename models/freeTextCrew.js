"use strict";
Promise = require('bluebird')

module.exports = function(sequelize, DataTypes) {
  var FreeTextCrew = sequelize.define("FreeTextCrew", {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true,
      validate: {
        notEmpty: true
      }
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
        this.belongsToMany(models.Activity, {through: "Activity2FreeTextCrew"});
      }
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return FreeTextCrew;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/freetextcrew', '/freetextcrew/:id'],
      actions: ['list']
    },
    customizationFunction: function(freeTextCrew) {
      freeTextCrew.use({});
      return;
    }
  });
}

