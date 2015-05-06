"use strict";
var express = require('express');
var router = express.Router();
var ResAjax = require('../helpers/resajax')
var Models = require('../models')
var Promise = require('bluebird')
var usnGenerator = require('../helpers/usnGenerator')
var Sequelize = require("sequelize");
var passport = require('passport');

router.use( function(req, res, next) {
    res.json403 = ResAjax.err403
    res.json401 = ResAjax.err401
    res.json404 = ResAjax.err404
    res.json500 = ResAjax.err500
    next()
});



router.get('/sync', passport.authenticate('token', { session: false }), function(req, res, next) {
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

router.post('/sync', passport.authenticate('token', { session: false }), function(req, res, next) {
	console.log(req)
	var size = req.get('content-length')
	var json = req.body
	var nModels = 0
	Object.keys(json.models).forEach(function(key) {
		var arr = json.models[key]
		nModels += arr.length
	})
	var q = {where: {id: req.user.userId}};
  	Models.User.find(q).done(function(err, user) {
  		if(err) {
  			console.log(err)
  			return res.json500(err)
  		}
  		if(!user) {
  			console.log("WTF:", req.params.token)
  			return res.json401()
  		}
		console.log("client " + user.email + " posted " + size + "KB of data containing " + nModels + " new or modified objects")
		console.log("posted from " + req.params['user-agent'])
		console.log(JSON.stringify(req.body, null, 4))

		processNewAndModifiedObjects(json)
		.then(function(e) {
			return res.status(200).json({});
		})
		

		
	})

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
			if(! /BelongsTo/.test(body.associationType)) {return}
		    var as = body.options.name.plural
			if(as) {
				as = as.charAt(0).toLowerCase() + as.slice(1)
			}
			var rDescriptor = {type: body.associationType, sourceModel: body.source.name, targetModel: body.target.name, as: as}
			if (body.associationType === 'BelongsToMany') {
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
				//console.log(body)
				var tableName = body.source.tableName
				var foreignKeyId = body.options.foreignKey
				var query = "SELECT id,\"" + foreignKeyId + "\" FROM \"" + tableName + "\";"
				console.log(query)
				queryPromises.push(Models.sequelize.query(query, {type: Models.sequelize.QueryTypes.SELECT})
						     .then(function(assocIds) {
						     	rDescriptor.idmap = assocIds
						     	rDescriptor.foreignKey = foreignKeyId
						     	delete rDescriptor.as
						     	rDescriptor.clientAssociationName = a.charAt(0).toLowerCase() + a.slice(1)
						     	json.relations.push(rDescriptor)
						     	return null
						     })
				)
			}
		})
	})
	return Promise.all(queryPromises).then(function() {
		console.log(JSON.stringify(json, null, 4))
		return json	
	})
	
}


var processNewAndModifiedObjects = function(json) {
	Object.keys(json).forEach(modelName, function(objectList) {
		console.log("processing incoming " + modelName)
		var modelClass = Models[modelName]
	})
}


module.exports = router