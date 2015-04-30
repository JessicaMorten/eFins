"use strict";
var express = require('express');
var router = express.Router();
var ResAjax = require('../helpers/resajax')
var Models = require('../models')
var Promise = require('bluebird')
var usnGenerator = require('../helpers/usnGenerator')
var Sequelize = require("sequelize");

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
			
			//console.log(allModels)
			
			return Promise.map(allModels, function(model) {
				return model.findAll({where: ["usn > ?", afterUsn]})
							.map(function(model) {
								
								if(model.usn > highestUsn) {
								 	highestUsn = model.usn
								}
								return model.toJSON()
							})
							.then(function(models) {
								var hash = {}
								hash[model.name] = models
								return hash
							})
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
						serializeRelations(json).then(function(newJson) {
							return res.status(200).json(newJson);
						})
					})
				} else {
					json.highestUsn = highestUsn
					serializeRelations(json).then(function(newJson) {
						return res.status(200).json(newJson);
					})
				}
			})
		}
	})
})

router.post('/sync', function(req, res, next) {
	var json = {}

	return res.status(200).json(json);

})

var serializeRelations = function(json) {
	json.relations = []
	var queryPromises = []
	var allModels = Models.sequelize.models
	Object.keys(allModels).forEach(function(k) {
		var m = allModels[k]
		if(Object.keys(m.associations).length == 0) {
			return 
		}
		Object.keys(m.associations).forEach(function(a) {
			var body = m.associations[a]
			if(! /BelongsToMany/.test(body.associationType)) {return}
		    var as = body.options.name.plural
			as = as.charAt(0).toLowerCase() + as.slice(1)
			var rDescriptor = {type: body.associationType, sourceModel: body.source.name, targetModel: body.target.name, as: as}
			if (body.associationType === 'BelongsToMany') {
				console.log(body)
				var tableName = body.throughModel.options.through
				rDescriptor.tableName = tableName
				queryPromises.push( Models.sequelize.query("SELECT * FROM \"" + tableName + "\";", {type: Models.sequelize.QueryTypes.SELECT})
						     .then(function(assocIds) {
						     	assocIds.forEach(function(i) {
						     		delete i.createdAt
						     		delete i.updatedAt
						     	})
						     	rDescriptor.idmap = assocIds
						     	json.relations.push(rDescriptor)
						     	return null
						     })
				)
			} else {
				json.relations.push(rDescriptor)
			}
		})
	})
	return Promise.all(queryPromises).then(function() {
		console.log(JSON.stringify(json, null, 4))
		return json	
	})
	
}


module.exports = router