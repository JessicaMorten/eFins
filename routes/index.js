var express = require('express');
var router = express.Router();
var passport = require('passport');
var fs = require('fs')

// /* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.post('/clientlog', passport.authenticate('token', { session: false }), function(req, res, next) {
	fs.appendFile(req.query.devid + ".log", req.body, function(err) {
		if (err) {return res.status(500)}
		else {return res.send("OK")}
	})
})

module.exports = router;
