"use strict";
module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable("Agencies", {
		name: {
		      type: DataTypes.STRING,
		      allowNull: false,
		      unique: true,
		      validate: {
				notEmpty: true
		      }
		},
	}).done(done);
  },
  down: function(migration, DataTypes, done) {
    migration.dropTable("Agencies").done(done);
  }
};
