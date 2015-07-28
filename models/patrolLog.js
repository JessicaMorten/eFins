"use strict";
Promise = require('bluebird')

module.exports = function(sequelize, DataTypes) {
  var PatrolLog = sequelize.define("PatrolLog", {
    date: {
      type: DataTypes.DATE,
      allowNull: false,
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
    },
    wasClear: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    wasWindy: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    wasFoggy: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    wasCalm: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    wasRainy: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hadSmallCraftAdvisory: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hadGale: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fuelToDate: {
      type: DataTypes.FLOAT
    },
    fuelPurchased: {
      type: DataTypes.FLOAT
    },
    lubeOil: {
      type: DataTypes.FLOAT
    },
    portHoursBroughtForward: {
      type: DataTypes.FLOAT
    },
    starboardHoursBroughtForward: {
      type: DataTypes.FLOAT
    },
    portLoggedHours: {
      type: DataTypes.FLOAT
    },
    starboardLoggedHours: {
      type: DataTypes.FLOAT
    },
    generatorHoursBroughtForward: {
      type: DataTypes.FLOAT
    },
    generatorLoggedHours: {
      type: DataTypes.FLOAT
    },
    outboardHoursBroughtForward: {
      type: DataTypes.FLOAT
    },
    outboardLoggedHours: {
      type: DataTypes.FLOAT
    },
    freeTextOthersAboard: {
      type: DataTypes.STRING
    }

  }, {
    classMethods: {
      apiSetup: apiSetup,
      associate: function(models) {
        this.belongsTo(models.User);
        this.belongsTo(models.AgencyVessel);
        this.belongsTo(models.Port, {as: "departurePort"});
        this.belongsToMany(models.AgencyFreetextCrew, {through: "AgencyFreetextCrew2PatrolLog", as: "freeTextCrew"});
        this.belongsToMany(models.User, {as: "crew", through: "PatrolLog2User"});
        this.hasMany(models.Activity);
      }
    },
    instanceMethods: {
     
    },
    paranoid: true,
    timestamps: true
  });
  return PatrolLog;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/agencyVessel', '/agencyVessel/:id'],
      actions: ['list']
    },
    customizationFunction: function(agencyVessels) {
      agencyVessels.use({});
      return;
    }
  });
}

