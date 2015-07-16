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
		//console.log(currentHighestUsn);
		//console.log(typeof currentHighestUsn);
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
					json.highestUsn = highestUsn;
					//console.log(highestUsn);
					//console.log(typeof highestUsn);
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
			console.log("Darn!", json)
			return res.status(200).json(json);
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
		console.log('json', json)
    var clientIdToServerModel = {}
    var modelIdToIncomingJson = {}
    return Models.sequelize.transaction().then(function(transaction) {
		return Promise.map(Object.keys(json.models), function(key) {
			var objectList = json.models[key]
			console.log("processing incoming " + key)
			var modelClass = Models[key]
			var clientToServer = {}
			var idToJson = {}
			return Promise.map(objectList, function(obj) {
				console.log('obj', obj)
				var modified_obj = jsonNormalize(obj, key)

				if (modified_obj.id) {
					// update existing model
					return modelClass.findOne({where: {id: modified_obj.id}}).then(function(model){
						console.log('found model', typeof model)
						return model.updateAttributes(modified_obj).then(function(ret){
							console.log('updated', ret, model)

							idToJson[model.id] = obj
							clientToServer[obj.id] = model
							return model
						});
					});
				} else {
					return modelClass

							.findOrCreate({where: modified_obj}, {transaction: transaction})
								.spread(function(model, created) {
								//console.log(model, created)
								if (obj.usn === -1) {
									clientToServer[obj.id] = model
								}
								idToJson[model.id] = obj
								return model
							})					
				}
			}).then(function(models) {
				var indexedModels = {}
				models.forEach(function(m) {
					console.log("Indexing " + key + " " + m.id)
					indexedModels[m.id] = m
				})
				clientIdToServerModel[key] = clientToServer
				modelIdToIncomingJson[key] = idToJson
				//.console.log(clientToServer)
				//console.log("Indexed " + key)
				return null
			})
		}).then( function() {
			// Now, run through all the models and set associations.
			return Promise.each(Object.keys(clientIdToServerModel), function(key) {
				console.log('one', key)
				return Promise.each(Object.keys(clientIdToServerModel[key]), function(mid) {
					console.log("By GEORGE!!!!!! " , mid)
					return setAssociations(clientIdToServerModel[key][mid], key, clientIdToServerModel, modelIdToIncomingJson, transaction)
				})
			})
		}).then( function(s) {
			//Suck-cess.  Commit & return the mapping of old clientIds to newly assigned server Ids
			return transaction.commit().then(function() {
				console.log(filteredIdMap(clientIdToServerModel))
				return filteredIdMap(clientIdToServerModel)
			})
			
		}, function(e) {
			console.log("Rolling back as a result of an error...", e, e.stack)
			transaction.rollback()
			throw e

		})
	})
}


var getAssocationProperties = function(modelClass) {
	var associations = Models.sequelize.models[modelClass].associations
	//console.log(associations)
	var assocProperties = []
	Object.keys(associations).forEach(function(key) {
		var assoc = associations[key]
		if(/BelongsTo/.test(assoc.associationType)) {
			var trueAssocName = assoc.as.charAt(0).toLowerCase() + assoc.as.slice(1)
			assocProperties.push(trueAssocName)
		}
	})
	return assocProperties

}

var findAssociationByAsName = function(as, modelClass) {
	var normalizedAsParameter = as.toLowerCase() 
	//console.log("searchin for " + normalizedAsParameter)
	var associations = Models.sequelize.models[modelClass].associations
	var assocName = ""
	for(assocName of Object.keys(associations)) {
		//console.log(assocName, Object.keys(associations))
		var assoc = associations[assocName]
		//console.log("comparing to " + assoc.as.toLowerCase())
		var compareTo = assoc.as.toLowerCase()
		if(!((compareTo < normalizedAsParameter) || (compareTo > normalizedAsParameter))) {
			return assoc
		}
	}
	return null
}

var isPlural = function(assoc) {
	if(String(assoc.associationType) === String("BelongsToMany")) {
		return true
	} 
	return false
}

var isAClientId = function(id) {
	return /[0-9a-fA-F]+-/.test(id)
}

var jsonNormalize = function(json, modelClass) {
	var assocProperties = getAssocationProperties(modelClass)
	var newJson = JSON.parse(JSON.stringify(json))
	newJson.createdAt = new Date(json.createdAt)
	newJson.updatedAt = new Date(json.updatedAt)
	if(isAClientId(json.id)) {
		delete newJson.id
	} else {
		newJson.id = parseInt(json.id)
	}
	Object.keys(json).forEach(function(key) {
		//console.log("Inspecting " + key + " " + json[key])
		if(assocProperties.indexOf(key) != -1) {
			console.log("Found & deleting " + key + " " + json[key])
			delete newJson[key]
		}
	})
	delete newJson.usn  // USN is NOT client-settable 
	return newJson
}

 
var setAssociations = function(model, modelType, clientIdToServerModel, idToJson, transaction) {
	var associations = Models.sequelize.models[modelType].associations
	var assocProperties = getAssocationProperties(modelType)
	//console.log(associations)

	return Promise.map(assocProperties, function(key) {
		var partialAssocName = key.charAt(0).toUpperCase() + key.slice(1)
		var methodName = "set" + partialAssocName
		//console.log("Assoc Method Name:", methodName, key)
		var assoc = findAssociationByAsName(key, modelType)
		var json = idToJson[modelType][model.id]
		if(isPlural(assoc)) {
			//console.log("Assoc Method Name " + methodName + " on a " + modelType + " is a plural")
			//console.log("Great SCOTT!", json[key])
			var arr = json[key]
			var newArr = []
			if(!arr || (arr.length <= 0)) {
				return null
			}
			arr.forEach(function(entry) {
				if(isAClientId(entry)) {
					entry = clientIdToServerModel[assoc.target.name][entry].id
					//console.log(assoc.target.name, entry)
				}
				newArr.push(entry)
			})
			return model[methodName](newArr, {transaction: transaction})
		} else {
			//console.log("Assoc Method Name " + methodName + " on a " + modelType + " is a singular")
			var index = json[key]
			if(!index) {return null}
			if(isAClientId(index)) {
				index = clientIdToServerModel[assoc.target.name][index].id
				console.log(assoc.target.name, index)
			}
			return model[methodName](index, {transaction: transaction})
		}
	
	})
}

var filteredIdMap = function(json) {
	var map = {}
	Object.keys(json).forEach(function(modelName) {
		map[modelName] = {}
		Object.keys(json[modelName]).forEach(function(mid) {
			map[modelName][mid] = json[modelName][mid].id.toString()
		})
	})
	return map
}


module.exports = router