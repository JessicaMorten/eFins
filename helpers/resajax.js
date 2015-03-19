"use strict";
var AjaxError = require('./ajaxerror')

module.exports.err500 = function(errobj) { return _err(errobj, 500, this ) }
module.exports.err403 = function(errobj) { return _err(errobj, 403, this ) }
module.exports.err401 = function(errobj) { return _err(errobj, 401, this ) }
module.exports.err404 = function(errobj) { return _err(errobj, 404, this ) }
var _err = function(errobj, code, res) {
  if (!(errobj instanceof Error)) {
    if ('object' === typeof errobj) {
      errobj = new Error(JSON.stringify(errobj))
    } else {
      errobj = new Error(errobj)
    }
  }
  var ae = new AjaxError(code, errobj)
  return res.status(code).json(ae)
}