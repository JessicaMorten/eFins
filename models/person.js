"use strict";
Promise = require('bluebird')

module.exports = function(sequelize, DataTypes) {
  var Person = sequelize.define("Person", {
    name: {
      type: DataTypes.STRING
    },
    license: {
      type: DataTypes.STRING
    },
    dateOfBirth: {
      type: DataTypes.DATE
    },
    address: {
      type: DataTypes.STRING
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
        this.hasMany(models.Activity, {as: 'crewActivities'});
        this.hasMany(models.Activity, {as: 'captainActivities'});
        this.belongsToMany(models.Activity, {as: 'activityPerson', through: "Activity2Person"});

      }
    },
    instanceMethods: {
      
    },
    paranoid: true,
    timestamps: true
  });
  return Person;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/person', '/person/:id'],
      actions: ['list']
    },
    customizationFunction: function(ps) {
      ps.use({});
      return;
    }
  });
}
