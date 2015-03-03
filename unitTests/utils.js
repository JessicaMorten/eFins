process.env.EFINS_PROTOCOL = "http";
process.env.EFINS_HOSTNAME = "localhost:3002";
var absUrl = require('../absoluteUrl.js');

exports.absoluteUrlCreation = function(test) {
  test.equals(absUrl("/foo", "bar"), "http://localhost:3003/foo/bar");
  test.done();
}