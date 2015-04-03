"use strict";

module.exports = function(sequelize, DataTypes) {
  var Activity = sequelize.define("Activity", {
    type: {
      type:   DataTypes.ENUM,
      values: ['cdfwCommercialBoardingCard', 'npsRecreationalBoardingCard', 'activityLog']
    },
    usn: {
      type: DataTypes.BIGINT,
      //allowNull: false,
      unique: true//,
      // validate: {
      //   notEmpty: true
      // }
    },
    time: {
      type: DataTypes.DATE
    },
    remarks: {
      type: DataTypes.STRING
    },
    latitude: {
      type: DataTypes.FLOAT
    },
    longitude: {
      type: DataTypes.FLOAT
    },
    locationManuallyEntered: {
      type: DataTypes.BOOLEAN
    }
  }, {
    classMethods: {
      apiSetup: apiSetup,
      associate: function(models) {
        this.hasMany(models.FreeTextCrew);
        this.hasMany(models.User);
        this.hasMany(models.Catch);
        this.hasOne(models.Port);
        this.hasOne(models.Vessel);
        this.hasOne(models.Fishery);
        this.hasOne(models.Action);
        this.hasOne(models.Person, {as: 'captain'});
        this.hasOne(models.Person, {as: 'person'});
        this.hasMany(models.Person, {as: 'crew'})
        this.hasMany(models.Photo)
        this.hasMany(models.EnforcementActionTaken, {as: 'enforcementActionsTaken'})
        this.hasOne(models.ContactType)
        this.belongsTo(models.PatrolLog)
      }
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return Activity;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/activity', '/activity/:id'],
      actions: ['list']
    },
    customizationFunction: function(activities) {
      activities.use({});
      return;
    }
  });
}

