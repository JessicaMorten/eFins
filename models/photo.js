"use strict";
Promise = require('bluebird')

module.exports = function(sequelize, DataTypes) {
  var Photo = sequelize.define("Photo", {
    s3key: {
      type: DataTypes.STRING
    },
    bucket: {
      type: DataTypes.STRING
    },
    uploaded: {
      type: DataTypes.BOOLEAN
    },
    uploadedThumbnail: {
      type: DataTypes.BOOLEAN
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
      // toJSON: function() {
      //   var hash = this.get()
      //   hash.lowResolution = this.lowResolution.toString()
      //   return hash
      // }
      
    },
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
