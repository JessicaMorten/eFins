"use strict";
module.exports = {
  up: function(migration, DataTypes, done) {
    var Models = require('../models');
    Models.Session.belongsTo(Models.User);
    Models.Session.sync({force: true}).then(function() {
      done();
    });
  },
  down: function(migration, DataTypes, done) {
    migration.dropTable("Sessions").done(done);
  }
};