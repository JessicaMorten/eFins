var sequelize = null;
var Sequelize = require('sequelize')
var Promise = require('bluebird')

var initialize = function(passed_sequelize) {
	sequelize = passed_sequelize;
	return sequelize.query("CREATE SEQUENCE usnGenerator", { type: Sequelize.QueryTypes.CREATE}).catch(function(e) {
		if(_isntAlreadyPresentError(e)) {
			throw e
		}
	});
}

var currentHighest = function () {
	if(! sequelize ) {
		throw new Error("UsnGenerator currentHighest() called before initialization")
	}
	return sequelize.query("SELECT last_value from usnGenerator").spread( function(results, metadata) {
		return parseInt(results[0]['last_value']);
	});
}

var getNext = function () {
	if(! sequelize ) {
		throw new Error("UsnGenerator getNext() called before initialization")
	}
	return sequelize.query("SELECT nextval('usnGenerator')").spread( function(results, metadata) {
		return( parseInt(results[0]['nextval']) );
	});
}

var _isntAlreadyPresentError = function(e) {
	return(! /relation.*already.*exists/.test(e.message));
}

var setupHooks = function(modeldef) {
	modeldef.hook('beforeCreate', _applyUpdatedUsn)
	modeldef.hook('beforeDestroy', _applyUpdatedUsn)
	modeldef.hook('beforeUpdate',_applyUpdatedUsn)
	modeldef.hook('beforeBulkCreate', _bulkApplyUpdatedUsn)
	modeldef.hook('beforeBulkUpdate', _bulkApplyUpdatedUsn)
	modeldef.hook('beforeBulkDestroy', _bulkApplyUpdatedUsn)
}

var _applyUpdatedUsn = function (instance, options, fn) {
	//console.log("running _applyUpdateUsn")
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