"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.addIndex(
      'Users',
      ['name'],
      {
        indexName: 'UserNameIndex',
        indicesType: 'UNIQUE'
      }
    );
    migration.addIndex(
      'Users',
      ['email'],
      {
        indexName: 'UserEmailIndex',
        indicesType: 'UNIQUE'
      }
    );
    done();
  },

  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.removeIndex('Users', 'UserNameIndex');
    migration.removeIndex('Users', 'UserEmailIndex');
    done();
  }
};
