"use strict";
var AjaxError = require('./ajaxerror')

// module.exports.err500 = function(errobj) { var myerr = _.bind(_err, this); return myerr(errobj, 500) }
// module.exports.err403 = function(errobj) { var myerr = _.bind(_err, this); return myerr(errobj, 403) }
// module.exports.err401 = function(errobj) { var myerr = _.bind(_err, this); return myerr(errobj, 401) }
// module.exports.err404 = function(errobj) { var myerr = _.bind(_err, this); return myerr(errobj, 404) }
module.exports.err500 = function(errobj) { return _err(errobj, 500) }
module.exports.err403 = function(errobj) { return _err(errobj, 403) }
module.exports.err401 = function(errobj) { return _err(errobj, 401) }
module.exports.err404 = function(errobj) { return _err(errobj, 404) }
var _err = function(errobj, code) {
  if (!(errobj instanceof Error)) {
    if ('object' === typeof errobj) {
      errobj = new Error(JSON.stringify(errobj))
    } else {
      errobj = new Error(errobj)
    }
  }
  var ae = new AjaxError(code, errobj)
  return this.status(code).json(ae)
}