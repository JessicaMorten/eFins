"use strict";

module.exports = function(sequelize, DataTypes) {
  var VesselType = sequelize.define("VesselType", {
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
        this.belongsToMany(models.Vessel, {through: "Vessel2VesselType"});
      }
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return VesselType;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/vesseltype', '/vesseltype/:id'],
      actions: ['list']
    },
    customizationFunction: function(types) {
      types.use({});
      return;
    }
  });
}

