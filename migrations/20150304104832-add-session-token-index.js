"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.addIndex(
      'Sessions',
      ['token'],
      {
        indexName: 'SessionTokenIndex',
        indicesType: 'UNIQUE'
      }
    );
    done();
  },

  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.removeIndex('Sessions', 'SessionTokenIndex');
    done();
  }
};
