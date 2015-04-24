"use strict";

module.exports = function(sequelize, DataTypes) {
  var AgencyVessel = sequelize.define("AgencyVessel", {
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
        this.belongsToMany(models.PatrolLog, {through: "PatrolLog2AgencyVessel"});
        this.belongsTo(models.Agency, {through: "Agency2AgencyVessel"});
      }
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return AgencyVessel;
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

