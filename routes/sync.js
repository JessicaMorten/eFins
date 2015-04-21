"use strict";
var express = require('express');
var router = express.Router();
var ResAjax = require('../helpers/resajax')
var Models = require('../models')
var Promise = require('bluebird')
var usnGenerator = require('../helpers/usnGenerator')

router.use( function(req, res, next) {
    res.json403 = ResAjax.err403
    res.json401 = ResAjax.err401
    res.json404 = ResAjax.err404
    res.json500 = ResAjax.err500
    next()
});



router.get('/sync', function(req, res, next) {
	// TODO validate each of these params
	//TODO filter secret attributes out of models
	if(! req.query.afterUsn ) {
		return res.json403("afterUsn required")
	}
	if(! req.query.endOfLastSync ) {
		return res.json403("endOfLastSync required")
	}
	// if(! req.query.maxCount ) {
	// 	return res.json403("maxCount required")
	// }
	var json = {models: {}}
	var highestUsn = -1
	var afterUsn = parseInt(req.query.afterUsn)
	usnGenerator.currentHighest().then(function(currentHighestUsn) {
		if(currentHighestUsn <= afterUsn) {
			console.log("No new data to send to client")
			return res.status(204).end()
		}
		else {
			var allModels = Models.allSequencedModelDefinitions()
			return Promise.map(allModels, function(model) {
				var p = model
							.findAll({where: ["usn > ?", afterUsn]})
							.then(function(models) {
								var hash = {}
								hash[model.name] = models
								models.forEach(function(model) {
									console.log("PAY ATTENTION:", model)
									if(model.usn > highestUsn) {
										highestUsn = model.usn
									}
								})
								return hash
							})
				return p
			}).each(function(chunk) {
				for (var key in chunk) {
		    		if (chunk.hasOwnProperty(key)) {
						json.models[key] = chunk[key]
					}
				}
			}).then(function() {
				json.timestamp = Math.floor(Date.now() / 1000)
				console.log("Highest USN was scanned as:", highestUsn)
				if (highestUsn == -1) {
					usnGenerator.currentHighest().then(function(usn) {
						console.log("Got highest usn", usn)
						json.highestUsn = usn
						return res.status(200).json(json)
					})
				} else {
					json.highestUsn = highestUsn
					return res.status(200).json(json);
				}
			})
		}
	})
})

router.post('/sync', function(req, res, next) {
	var json = {}

	return res.status(200).json(json);

})


module.exports = router