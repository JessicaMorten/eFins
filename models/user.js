"use strict";
var bcrypt = require("bcrypt");

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        // bcrypt hashes are always 60 characters
        len: [60, 60]
      },
      // setting hash directly should result in an error.
      set: function setUserHash(v) {
        throw new Error("Do not set hash directly. Use User#setPassword");
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    }
  }, {
    classMethods: {
      // cb - this was auto-generated. Not sure of it's utility
      associate: function(models) {
        // associations can be defined here
      }
    },
    instanceMethods: {
      setPassword: function setPassword(password, done) {
        var set = this.setDataValue;
        bcrypt.hash(password, 12, function(err, hash) {
          set('hash', hash);
          if (done) { done(err, hash); };
        });
      },
      verifyPassword: function verifyPassword(password, done) {
        bcrypt.compare(password, this.hash, done);
      }
    }
  }, {
    paranoid: true
  });
  return User;
};