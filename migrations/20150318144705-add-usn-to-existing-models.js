"use strict";

module.exports = {
	up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.addColumn(
      'Users',
      'usn',
      {
	      type: DataTypes.BIGINT,
	      //allowNull: false,
	      unique: true//,
	      // validate: {
	      //   notEmpty: true
	      // }
	  }
    );


    migration.addColumn(
      'Agencies',
      'usn',
      {
	      type: DataTypes.BIGINT,
	      //allowNull: false,
	      unique: true//,
	      // validate: {
	      //   notEmpty: true
	      // }
  	  }
    );
    migration.addIndex('Users', ['usn'])
    migration.addIndex('Agencies', ['usn'])
    done();
  },

  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.removeColumn('Users', 'usn');
    migration.removeColumn('Agencies', 'usn');
    done();
  }
};
