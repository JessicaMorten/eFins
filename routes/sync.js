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
	//console.log(req)
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
		.then(function(json) {
			return res.status(200).json({});
		}).catch( function(e) {
			return res.json500(e)
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
				//console.log(query)
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
		//console.log(JSON.stringify(json, null, 4))
		return json	
	})
	
}


var processNewAndModifiedObjects = function(json) {

    var clientIdToServerModel = {}
    return Models.sequelize.transaction().then(function(transaction) {
		return Promise.map(Object.keys(json.models), function(key) {
			var objectList = json.models[key]
			console.log("processing incoming " + key)
			var modelClass = Models[key]
			var clientToServer = {}
			return Promise.map(objectList, function(obj) {
				var modified_obj = jsonNormalize(obj, key)
				return modelClass
						.findOrCreate({where: modified_obj}, {transaction: transaction})
							.spread(function(model, created) {
							//console.log(model, created)
							if (obj.usn === -1) {
								clientToServer[obj.id] = model
							}
							return model
						})
			}).then(function(models) {
				var indexedModels = {}
				models.forEach(function(m) {
					console.log("Indexing " + key + " " + m.id)
					indexedModels[m.id] = m
				})
				clientIdToServerModel[key] = clientToServer
				//.console.log(clientToServer)
				console.log("Indexed " + key)
				return null
			})
		}).then( function() {
			console.log("GFY", filteredIdMap(clientIdToServerModel))
			// Now, run through all the models and set associations.
			return Promise.each(Object.keys(clientIdToServerModel), function(key) {
				console.log("G")
				return Promise.each(Object.keys(clientIdToServerModel[key]), function(mid) {
					console.log("F")
					return setAssociations(clientIdToServerModel[key][mid], key, clientIdToServerModel, transaction)
				})
			})
		}).then( function(s) {
			//Suck-cess.  Commit & return the mapping of old clientIds to newly assigned server Ids
			return transaction.commit().then(function() {
				return filteredIdMap(clientIdToServerModel)
			})
			
		}, function(e) {
			console.log("Rolling back as a result of an error...", e, e.stack)
			transaction.rollback()
			throw e

		})
	})
}

var jsonNormalize = function(json, modelClass) {
	var associations = Models.sequelize.models[modelClass].associations
	//console.log(associations)
	var assocProperties = []
	Object.keys(associations).forEach(function(key) {
		var assoc = associations[key]
		if(/BelongsTo/.test(assoc.associationType)) {
			assocProperties.push(assoc.as)
		}
	})
	console.log(assocProperties)

	var newJson = JSON.parse(JSON.stringify(json))
	newJson.createdAt = new Date(json.createdAt)
	newJson.updatedAt = new Date(json.updatedAt)
	if(/[0-9a-fA-F]+-/.test(json.id)) {
		delete newJson.id
	} 
	Object.keys(json).forEach(function(key) {
		//console.log("Inspecting " + key + " " + json[key])
		if(key in assocProperties) {
			console.log("Found & deleting" + key + " " + json[key])
			delete newJson[key]
		}
	})
	delete newJson.usn  // USN is NOT client-settable 
	return newJson
}


var isAssociation = function(idString) {
	if(/[0-9a-fA-F]+-/.test(idString)) {
		if(idString != "id") {
			console.log("ASSociation " + idString)
			return true
		}
	}
	return false
}
 
var setAssociations = function(model, modelType, clientIdToServerModel, transaction) {
	console.log("GODDAMN")
	var associations = Models.sequelize.models[modelType].associations
	Object.keys(associations).forEach(function(a) {
		var body = associations[a]
		if(! /BelongsTo/.test(body.associationType)) {return}
		console.log("Handling association " + body.options.name.plural + "for " + modelType + " " + model.id)
		var assocValue = model[body.options.name.plural]
	})



	return Promise.map(Object.keys(model), function(key) {
		if(isAssociation(model[key])) {
			var partialAssocName = key.charAt(0).toUpperCase + key.slice(1)
			var methodName = "set" + key
			console.log("Assoc Method Name:", methodName)
			var target = clientIdToServerModel[modelType][key]
			if(!target) {
				console.log("FUCK FUCK FUCK")
				return null
			}
			return model[methodName](target, {transaction: transaction})
		}
		return null
	})
}

var filteredIdMap = function(json) {
	var map = {}
	Object.keys(json).forEach(function(modelName) {
		map[modelName] = {}
		Object.keys(json[modelName]).forEach(function(mid) {
			map[modelName][mid] = json[modelName][mid].id
		})
	})
	return map
}


module.exports = router