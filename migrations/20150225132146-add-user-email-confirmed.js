"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.addColumn(
      'Users',
      'emailConfirmed',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    );
    done();
  },

  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.removeColumn('Users', 'emailConfirmed');
    done();
  }
};
