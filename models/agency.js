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
  }, {
    classMethods: {
      
    },
    instanceMethods: {
      
    }
  }, {
    paranoid: true,
    timestamps: true
  });
  return Agency;
};

