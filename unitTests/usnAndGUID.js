var Models = require('../models');
var usn = require('../helpers/usnGenerator');

exports.setUp = function(done) {
  Models.sequelize.sync({force: true}).then(function(){
    Models.initializeUsnGenerator().done(done);
  });
}

exports.usn = {

  'increments when creating new records': function(test) {
    usn.currentHighest().then(function(highest){
      var currentUsn = highest;
      // we save two because, obnoxiously, the sequence starts at 1 for the 
      // current value, even though nextval hasn't been called yet.
      Models.Species.build({name: 'Caranx ignobilis'})
        .save().then(function(spp1){
          Models.Species.build({name: 'Caranx melampygus'})
            .save().then(function(spp2){
              usn.currentHighest().then(function(highest){
                test.ok(highest > currentUsn, "USN has been incremented");
                test.equals(spp2.usn, highest);
                test.done();
              });
            });
        });
    });
  },

  'increments when updating records': function(test) {
    Models.Species.build({name: 'Caranx ignobilis'})
      .save().then(function(spp1){
        usn.currentHighest().then(function(highest){
          var currentUsn = highest;
          spp1.name = "Caranx indominable";
          spp1.save().then(function(spp1){
            usn.currentHighest().then(function(highest){
              test.ok(highest > currentUsn, "USN has been incremented");
              test.equals(spp1.usn, highest);
              test.done();
            });
          });
        });
      });
  },

  'increments when deleting records': function(test) {
    Models.Species.build({name: 'Caranx ignobilis'})
      .save().then(function(spp1){
        usn.currentHighest().then(function(highest){
          var currentUsn = highest;
          spp1.destroy().then(function(){
            usn.currentHighest().then(function(highest){
              test.ok(highest > currentUsn, "USN has been incremented");
              test.done();
            });
          });
        });
      });
  },  

}

exports.guid = {
  'guid can be automatically assigned': function(test) {
    Models.Species.build({name: 'Caranx ignobilis'})
      .save().then(function(spp1){
        test.ok(spp1.id)
        test.equals(spp1.id.length, 36);
        test.done();
      });
  },

  'or guid can be manually assigned': function(test) {
    var id = "ba0a0f41-ad05-4f6c-9f69-a38225b0e437";
    Models.Species.build({name: 'Caranx ignobilis', id: id })
      .save().then(function(spp1){
        test.ok(spp1.id)
        test.equals(spp1.id.length, 36);
        test.equals(spp1.id, id);
        test.done();
      });
  },

  'foreign keys still work when manually assigned': function(test) {
    var sppId = "ba0a0f41-ad05-4f6c-9f69-a38225b0e437";
    Models.Species.build({name: 'Caranx ignobilis', id: sppId })
      .save().then(function(spp1){
        test.ok(spp1.id)
        test.equals(spp1.id.length, 36);
        test.equals(spp1.id, sppId);
        Models.Catch.build({SpeciesId: sppId, amount: 1000})
          .save().then(function(aCatch){
            test.equals(spp1.id, aCatch.SpeciesId);
            aCatch.getSpecies().then(function(spp){
              test.equals(spp.id, spp1.id);
              test.done();
            });
          })
      });
  }
}