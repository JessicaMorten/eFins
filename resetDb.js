"use strict";

var Models = require('./models');


var trbuser = null
var nps = null
var plog = null
var boat = null


Models.sequelize
.query("drop schema public cascade")
.then(function() {
	return Models.sequelize.query("create schema public")
})
.then(function() {
	return Models.sequelize.sync({force: true})
})
.then(function() {
	console.log("Just wiped out the DB")
	Models.init().then(function() {
	  	Models.initializeUsnGenerator()
	}).then(function(){
		process.exit()
	})
});