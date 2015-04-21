"use strict";

module.exports = function(sequelize, DataTypes) {
  var Action = sequelize.define("Action", {
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
        this.hasMany(models.Activity);
      }
    },
    instanceMethods: {
      toJSON: function() {
        var x = this.get()
        x.id = x.id.toString()
        return x
      }
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return Action;
};

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/action', '/action/:id'],
      actions: ['list']
    },
    customizationFunction: function(actions) {
      actions.use({});
      return;
    }
  });
}

