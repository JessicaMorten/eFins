"use strict";
Promise = require('bluebird')

module.exports = function(sequelize, DataTypes) {
  var Photo = sequelize.define("Photo", {
    originalUrl: {
      type: DataTypes.STRING
    },
    latitude: {
      type: DataTypes.FLOAT
    },
    longitude: {
      type: DataTypes.FLOAT
    },
    lowResolution: {
      type: DataTypes.BLOB
    },
    originalBlob: {
      type: DataTypes.BLOB
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
        this.belongsToMany(models.Activity,  {through: "Activity2Photos"});
      }
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return Photo;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/photo', '/photo/:id'],
      actions: ['list']
    },
    customizationFunction: function(photos) {
      photos.use({});
      return;
    }
  });
}
