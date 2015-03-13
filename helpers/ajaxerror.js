"use strict";
function AjaxError(code, error_obj) {
    this.code = 500
    this.code = ((code < 400) || (code > 500)) ? this.code : code 
    this.error = error_obj
    this.message = error_obj.message || ""
    this.details = []
}

AjaxError.prototype.addDetails = function(details) {
  this.details.push(details)
}


AjaxError.prototype.toJSON = function() {
    return({"error" : { "code": this.code, "message": this.message, "details": this.details }})
}

module.exports = AjaxError