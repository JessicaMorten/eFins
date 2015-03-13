"use strict";
var SequelizeManager = require('./sequelizeManager')
console.log(SequelizeManager.get().import)
var User = SequelizeManager.get().import('../models/user')
var Agency = SequelizeManager.get().import('../models/agency')

module.exports = function() {
  Agency.sync()

  User.belongsTo(Agency)
  Agency.hasMany(User)
  //Foo.hasMany Choo
  //Foo.hasMany Poo
  //UserRole.belongsTo User
  //UserRole.belongsTo Organization
}