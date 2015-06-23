var Models = require('../models');
var helpers = require('../helpers/sync');

exports.setUp = function(done) {
  Models.sequelize.sync({force: true}).then(function(){
    Models.initializeUsnGenerator().done(done);
  });
}

exports.usn = {
  'getOrderedRecordList': {
    'returns records in usn order': function(test){
      Models.Species.build({name: 'Fish'}).save()
      .then(function() {
        Models.Species.build({name: 'Fishy'}).save()
        .then(function() {
          Models.Species.build({name: 'Fishies'}).save()
          .then(function() {
            helpers.getOrderedRecordList(0, null, function(err, records) {
              test.ifError(err);
              test.equals(3, records.length, "3 records");
              test.ok(records[0].usn < records[2].usn, "In USN order");
              test.done();
            });            
          })  
        })
      })
    }
  }

}