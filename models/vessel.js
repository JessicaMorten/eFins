"use strict";

module.exports = function(sequelize, DataTypes) {
  var Vessel = sequelize.define("Vessel", {
    name: {
      type: DataTypes.STRING
    },
    registration: {
      type: DataTypes.STRING
    },
    fgNumber: {
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
        this.belongsTo(models.VesselType, {through: "Vessel2VesselType"})
        this.belongsToMany(models.Activity, {through: "Activity2Vessel"});
      }
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return Vessel;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/vessel', '/vessel/:id'],
      actions: ['list']
    },
    customizationFunction: function(vts) {
      vts.use({});
      return;
    }
  });
}
