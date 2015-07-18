"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
   
         return(migration.addColumn(
              "Photos",
              "bucket",
              DataTypes.STRING
           ).then(function() {return done();}).catch(function(err) {return done();}));

    //  } else return null
    // })
  },

  down: function(migration, DataTypes, done) {
 
        return migration.removeColumn(
              "Photos",
              "bucket"
           ).then(done).catch(function(err) { return done(); });
    
   
  }
};
