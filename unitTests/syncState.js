var Models = require('../models');
var User = Models.User;
var request = require('request');
var absUrl = require('../absoluteUrl');

var helpers = require('./helpers').helpers();
var authorize = helpers.authorize;

module.exports = {

  setUp: function(done) {
    Models.sequelize.sync({force: true}).then(function(){
      Models.initializeUsnGenerator().done(done);
    });
  },

  'can get sync state': function(test) {
    authorize({
      email: 'test@example.com',
      name: 'Test User',
      approved: true,
      emailConfirmed: true,
      password: 'password'
    }, function(err, user, client) {
      test.ifError(err);
      client.get({uri: absUrl("/api/1/state"), json: true}, function(e, r, b) {
        test.ifError(e);
        test.ok(b.updateCount);
        test.equals(new Date(b.fullSyncBefore).getTime(), new Date(0).getTime());
        test.done();
      });
    });
  },

  'sync state updateCount increases with db changes': function(test) {
    authorize({
      email: 'test@example.com',
      name: 'Test User',
      approved: true,
      emailConfirmed: true,
      password: 'password'
    }, function(err, user, client) {
      test.ifError(err);
      client.get({uri: absUrl("/api/1/state"), json: true}, function(e, r, b) {
        test.ifError(e);
        test.ok(b.updateCount);
        var updateCount = b.updateCount;
        Models.Species.build({name: 'Paralabrax clathratus'}).save().then(function(){
          client.get({uri: absUrl("/api/1/state"), json: true}, function(e, r, b) {
            test.ifError(e);
            test.ok(b.updateCount > updateCount, 'Update count increased');
            test.done();
          });
        });
      });
    });    
  }
}
