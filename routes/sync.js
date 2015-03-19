"use strict";
var express = require('express');
var router = express.Router();
var ResAjax = require('../helpers/resajax')
var Models = require('../models')
var Promise = require('bluebird')

router.use( function(req, res, next) {
    res.json403 = ResAjax.err403
    res.json401 = ResAjax.err401
    res.json404 = ResAjax.err404
    res.json500 = ResAjax.err500
    next()
});



router.get('/api/1/sync', function(req, res, next) {
	// TODO validate each of these params
	if(! req.query.afterUsn ) {
		return res.json403("afterUsn required")
	}
	if(! req.query.endOfLastSync ) {
		return res.json403("endOfLastSync required")
	}
	if(! req.query.maxCount ) {
		return res.json403("maxCount required")
	}
	var json = {}
	var queryPromises = []
	var allModels = Models.allSequencedModelDefinitions()
	Promise.map(allModels, function(model) {
		var p = model
					.findAll({where: ["usn > ?", req.query.afterUsn]})
					.then(function(models) {
						var hash = {}
						hash[model.name] = models
						return hash
					})
		return p
	}).each(function(chunk) {
		for (var key in chunk) {
    		if (chunk.hasOwnProperty(key)) {
				json[key] = chunk[key]
			}
		}
	}).then(function() {
		return res.status(200).json(json);
	})
})

router.post('/api/1/sync', function(req, res, next) {
	var json = {}

	return res.status(200).json(json);

})

module.exports = router