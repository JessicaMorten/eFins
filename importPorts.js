"use strict";
var sequelize = require('sequelize');
var ports = require('./ports.js');
var Models = require('./models')


Models.init().then(function() {
  Models.initializeUsnGenerator()
  ports.forEach(function(name) {
    var port = Models.Port.build({name: name});
    port.save().done(function(e) {
      console.log(e);
    })
  });
});
