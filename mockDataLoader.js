"use strict";
Error.stackTraceLimit = Infinity;
var path = require('path');
var logger = require('morgan');
var sequelize = require('sequelize')
var usnGenerator = require('./helpers/usnGenerator')
var longjohn = require('longjohn')


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
	  	.then(function() {
	  	  return create_user()
	  	})
	  	.then(function() {
		  return create_actions()
			}).then(function(tmp_actions) {
			  return create_agencies()
			}).all().then(function(tmp_agencies) {
				return create_agencyVessels(tmp_agencies)
			}).then(function() {
				return create_patrolLogs()
			}).then(function() {
				console.log("Settin' some associations")
				trbuser.setAgency(nps)
				return trbuser.save()
			}).then(function() {
				process.exit()
			})
	})


	var create_actions = function () {
		console.log("Creatin' actions")
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
		console.log("Creatin' agencies")
		return [
			Models.Agency.create({
				name: "California Department of Fish and Wildlife"
			}),
			function() {
				var m = Models.Agency.build({
					name: "National Park Service"
				})
				nps = m
				return m.save()
			}(),
		    Models.Agency.create({
				name: "US Coast Guard"
			})
		]
	}


	var create_agencyVessels = function (agencies) {
		console.log("Creatin' agency vessels")
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
			boat = tmp_vessel
			return tmp_vessel.setAgency(agencies[2])
		})
	}

	var create_patrolLogs = function (agencies) {
		console.log("Creatin' patrol logs")
		return Models.PatrolLog.create({
			date: new Date(),
			wasClear: true,
			fuelToDate: 32.4,
			fuelPurchased: 3232.2,
			lubeOil: 882.2,
			portHoursBroughtForward: 39.7,
			starboardHoursBroughtForward: 3232.6,
			portLoggedHours: 455.4,
			starboardLoggedHours: 4343.3,
			generatorHoursBroughtForward: 433.3,
			generatorLoggedHours: 22.2,
			outboardHoursBroughtForward: 44.4,
			freeTextOthersAboard: "Simon",
			outboardLoggedHours: 2
		}).then(function(pl) {
			pl.setUser(trbuser)
			pl.setAgencyVessel(boat)
			plog = pl
			return pl.save()
		}).then(function() {
			return Models.Activity.create({
				type: "cdfwCommercialBoardingCard",
				time: new Date(),
				remarks: "It was stunning",
				latitude: 35.0,
				longitude: -119.8,
				locationManuallyEntered: false,
				numPersonsOnBoard: 3,
				categoryOfBoarding: "Engorged"
			}).then(function(act) {
				return Promise.join(act.addUser(trbuser), act.setPatrolLog(plog), act.save())
			})
			
		})
	}

	var create_user = function () {
		console.log("Creatin' user")
		var user = Models.User.build({
			name: "Todd Bryan",
			email: "todd.r.bryan@gmail.com",
			approved: true,
			emailConfirmed: true
		})

		user.setpw = Promise.promisify(user.setPassword)

		trbuser = user

		return user.setpw('bobobobo').then(function() {user.save()})
		
	}
});