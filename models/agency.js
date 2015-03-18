"use strict";

module.exports = function(sequelize, DataTypes) {
  var Agency = sequelize.define("Agency", {
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
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    }
  }, {
    classMethods: {
      apiSetup: apiSetup
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return Agency;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/agencies', '/agencies/:id'],
      actions: ['list']
    },
    customizationFunction: function(agencies) {
      agencies.use({});
      return;
    }
  });
}

