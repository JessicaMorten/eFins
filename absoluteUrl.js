"use strict";

var urlJoin = require('url-join');

var baseUrl = process.env.EFINS_PROTOCOL || "http";
baseUrl += "://";
/* istanbul ignore next */
baseUrl += process.env.EFINS_HOSTNAME || "localhost:3002";

/* istanbul ignore if */
if (!process.env.NODE_ENV === 'test') {
  console.log(
    "Absolute urls will be created with the following base: ", baseUrl);  
}

module.exports = function absoluteUrl() {
  var args = Array.prototype.slice.call(arguments);
  return urlJoin.apply(this, [baseUrl].concat(args));
}