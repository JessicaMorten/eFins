"use strict";

module.exports = function(sequelize, DataTypes) {
  var ContactType = sequelize.define("ContactType", {
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
        this.hasMany(models.Activity);
      }
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return ContactType;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/contacttype', '/contacttype/:id'],
      actions: ['list']
    },
    customizationFunction: function(cts) {
      cts.use({});
      return;
    }
  });
}
