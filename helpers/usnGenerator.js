var sequelize = null;
var Sequelize = require('sequelize')
var Promise = require('bluebird')


var initialize = function(passed_sequelize) {
	sequelize = passed_sequelize;
	return sequelize.query("CREATE SEQUENCE usnGenerator", { type: Sequelize.QueryTypes.CREATE}).catch(function(e) {
		if(_isntAlreadyPresentError(e)) {
			throw e
		} else {
			console.log("usnGenerator sequence already present in database")
		}
	});
}

var currentHighest = function () {
	if(! sequelize ) {
		throw new Error("UsnGenerator currentHighest() called before initialization")
	}
	return sequelize.query("SELECT * FROM usnGenerator").spread( function(results, metadata) {
		return(results[0]['lastvalue']);
	});
}

var getNext = function () {
	if(! sequelize ) {
		throw new Error("UsnGenerator getNext() called before initialization")
	}
	return sequelize.query("SELECT nextval('usnGenerator')").spread( function(results, metadata) {
		return(results[0]['nextval']);
	});
}

var _isntAlreadyPresentError = function(e) {
	return(! /relation.*already.*exists/.test(e.message));
}

var setupHooks = function(modeldef) {
	modeldef.hook('afterCreate', _applyUpdatedUsn)
	modeldef.hook('afterDestroy', _applyUpdatedUsn)
	modeldef.hook('afterUpdate',_applyUpdatedUsn)
	modeldef.hook('afterBulkCreate', _bulkApplyUpdatedUsn)
	modeldef.hook('afterBulkUpdate', _bulkApplyUpdatedUsn)
	modeldef.hook('afterBulkDestroy', _bulkApplyUpdatedUsn)
}

var _applyUpdatedUsn = function (instance, options, fn) {
	getNext().then(function(nextUsn) {
		instance.usn = nextUsn;
		fn(null, instance);
	})
}

var _bulkApplyUpdatedUsn = function (instances, options, fn) {
	Promise.map(instances, function(instance) {
		getNext().then(function(nextUsn) {
			instance.usn = nextUsn;
		})
	}).then(fn)
}

module.exports = {
	initialize: initialize,
	currentHighest: currentHighest,
	getNext: getNext,
	setupHooks: setupHooks
}