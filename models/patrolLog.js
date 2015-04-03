"use strict";

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
      type: DataTypes.BIGINT,
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
        this.belongsTo(models.User, {through: "PatrolLog2User"});
        this.belongsTo(models.AgencyVessel, {through: "PatrolLog2AgencyVessel"});
        this.belongsTo(models.Port, {as: "departurePort", through:"PatrolLog2Port"});
        this.belongsToMany(models.FreeTextCrew, {through: "FreeTextCrew2PatrolLog"});
        this.belongsToMany(models.Activity, {through: "Activity2PatrolLog"});
      }
    },
    instanceMethods: {
      
    }
  }, {
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
