"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
   
    	   return(migration.addColumn(
            	"Photos",
            	"s3key",
            	DataTypes.STRING
           ).then(function() {return done();}).catch(function(err) {return done();}));

    // 	} else return null
    // })
  },

  down: function(migration, DataTypes, done) {
 
    		return migration.removeColumn(
            	"Photos",
            	"s3key"
           ).then(done).catch(function(err) { return done(); });
    
   
  }
};
