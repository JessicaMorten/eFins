"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    var Models = require('../models');
	Models.sequelize
	.query("drop schema public cascade")
	.then(function() {
		return Models.sequelize.query("create schema public")
	})
	.then(function() {
		return Models.sequelize.sync({force: true})
	})
	.then(function() {
		console.log("Just wiped out and recreated the DB")
		return Models.init().then(function() {
			return done();
		})
	})
  },

  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    done();
  }
};
