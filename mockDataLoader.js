"use strict";
var path = require('path');
var logger = require('morgan');
var sequelize = require('sequelize')
var usnGenerator = require('./helpers/usnGenerator')


var Models = require('./models');


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
	  	.then(function() {
		  return create_actions()
		}).then(function(tmp_actions) {
		  return create_agencies()
		}).all().then(function(tmp_agencies) {
			return create_agencyVessels(tmp_agencies)
		}).then(function(tmp_agencyVessels) {
			process.exit()
		})
	})


	var create_actions = function () {
		return Models.Action.create({
			name: "Trolling"
		}).then(function() {
			return Models.Action.create({
				name: "Trawling"
			})
		}).then(function() {
			return Models.Action.create({
				name: "Purse Seine"
			})
		})
	}


	var create_agencies = function () {
		return [
			Models.Agency.create({
				name: "California Department of Fish and Wildlife"
			}),
			Models.Agency.create({
				name: "National Park Service"
			}),
		    Models.Agency.create({
				name: "US Coast Guard"
			})
		]
	}


	var create_agencyVessels = function (agencies) {
		return Models.AgencyVessel.create({
			name: "Swordfish"
		}).then(function(tmp_vessel) {
			return tmp_vessel.setAgency(agencies[0]).then(function() {
				return Models.AgencyVessel.create({
					name: "Ocean Ranger"
				})
			})
			return 
		}).then(function(tmp_vessel) {
			return tmp_vessel.setAgency(agencies[1]).then(function() {
				return Models.AgencyVessel.create({
					name: "Blackfin"
				})
			})
		}).then(function(tmp_vessel) {
			return tmp_vessel.setAgency(agencies[2])
		})
	}
});