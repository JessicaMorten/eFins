"use strict";
var jwt = require('jsonwebtoken');

/* istanbul ignore if */
if (!process.env.EFINS_SECRET && process.env.NODE_ENV !== 'test') {
  console.error('EFINS_SECRET not set. This is INSECURE!');
}

var SECRET = process.env.EFINS_SECRET || 'insecure';


module.exports = function(sequelize, DataTypes) {
  var Session = sequelize.define("Session", {
    token: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      },
      createForUser: function(user, next) {
        this.build({
          UserId: user.id,
          token: jwt.sign({
            userId: user.id, 
            authorized: user.isAllowed()
          }, SECRET)
        }).save().done(next);
      }
    },
    instanceMethods: {
      toString: function() {
        return "Bearer " + this.token;
      },
      toJSON: function() {
        return {'token': this.token};
      }
    }
  });
  Session.SECRET = SECRET;
  return Session;
};