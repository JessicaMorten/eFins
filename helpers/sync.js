var Models = require('../models');

module.exports = {
  getOrderedRecordList: function(afterUSN, maxEntries, next) {    
    var models = Models.allSequencedModelDefinitions();
    maxEntries = maxEntries || 1000;
    // get records for each model
    Promise.map(models, function(model) {
      return model.findAll({where: ["usn > ?", afterUSN], limit: maxEntries})
    }).then(function(results) {
      // flatten the array of results
      var records = results.reduce(function(a, b) { return a.concat(b) });
      // sort by ascending usn and proper insertion order
      records.sort(sortBySafeInsertOrder(records));
      console.log(records[records.length - 1].Model);
      // limit to maxEntries
      if (maxEntries) {
        records = records.slice(0, maxEntries);
      }
      next(null, records);
    }).catch(function(e) {
      next(e, null);
    })
  }
}

function sortBySafeInsertOrder(records) {
  var ids = records.map(function(r) { return r.id });
  return function(a, b) {
    var associations = a.Model.associations;
    if (associations.length) {
      console.log(associations);
    }
    return a.usn - b.usn;
  }
}
