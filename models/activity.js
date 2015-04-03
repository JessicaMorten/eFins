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
        this.belongsToMany(models.FreeTextCrew, {through: "Activity2FreeTextCrew"});
        this.belongsToMany(models.User, {through: "Activity2User"});
        this.belongsToMany(models.Catch, {through: "Activity2Catch"});
        this.belongsTo(models.Port, {through: "Activity2Port"});
        this.belongsTo(models.Vessel, {through: "Activity2Vessel"});
        this.belongsTo(models.Fishery, {through: "Activity2Fishery"});
        this.belongsTo(models.Action, {through: "Action2Activity"});
        this.belongsTo(models.Person, {as: 'captain', through: "Activity2Person"});
        this.belongsTo(models.Person, {as: 'person', through: "Activity2Person"});
        this.belongsToMany(models.Person, {as: 'crew', through: "Activity2Person"})
        this.belongsToMany(models.Photo, {through: "Activity2Photo"})
        this.belongsToMany(models.EnforcementActionTaken, {as: 'enforcementActionsTaken', through: "Activity2EnforcementActionTaken"})
        this.belongsTo(models.ContactType, {through: "Activity2ContactType"})
        this.belongsTo(models.PatrolLog, {through: "Activity2PatrolLog"})
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

