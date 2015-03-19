"use strict";
var express = require('express');
var router = express.Router();



router.get('/api/1/sync', function(req, res, next) {
	if(! req.params.afterUsn ) {
		return res.err403("afterUsn required")
	}
	if(! req.params.endOfLastSync ) {
		return res.err403("endOfLastSync required")
	}
	if(! req.params.maxCount ) {
		return res.err403("maxCount required")
	}




	var json = {}
	//app.locals.



	return res.status(200).json(json);

})

router.post('/api/1/sync', function(req, res, next) {


})

module.exports = router