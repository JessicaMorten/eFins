"use strict";
Promise = require('bluebird')

module.exports = function(sequelize, DataTypes) {
  var AgencyFreetextCrew = sequelize.define("AgencyFreetextCrew", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
        this.belongsToMany(models.PatrolLog, {through: "AgencyFreetextCrew2PatrolLog"});
      }
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return AgencyFreetextCrew;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/agencyfreetextcrew', '/agencyfreetextcrew/:id'],
      actions: ['list']
    },
    customizationFunction: function(freeTextCrew) {
      freeTextCrew.use({});
      return;
    }
  });
}

