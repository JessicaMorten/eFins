'use strict';

var models = require('../models').init()
var Promise = require('bluebird')
var tables = [
      "Actions",
      "Activities",
      "Agencies",
      "AgencyFreetextCrews",
      "AgencyVessels",
      "Catches",
      "ContactTypes",
      "EnforcementActionTakens",
      "EnforcementActionTypes",
      "Fisheries",
      "FreeTextCrews",
      "PatrolLogs",
      "People",
      "Photos",
      "Ports",
      "Species",
      "Users",
      "Vessels",
      "VesselTypes",
      "ViolationTypes"
    ]

module.exports = {
  //up: function (queryInterface, Sequelize) {
  up: function (migration, DataTypes) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */

    /* Add a string of oaths here, damning Sequelize and all it stands for */
    
    var table_promises = []
    tables.forEach(function(table) {
      migration.describeTable(table).then(function(attrs) {
        if(! attrs.deletedAt) {
           console.log("Adding deletedAt to ", table)
           table_promises.push(migration.addColumn(
            table,
            'deletedAt',
            DataTypes.DATE
           ))
        }
      })
     
    })
    return Promise.all(table_promises)
  },

  down: function (migration, DataTypes) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */

    var table_promises = []
    tables.forEach(function(table) {
      table_promises.push(migration.removeColumn(
        table,
        'deletedAt'
      ))
    })
    return Promise.all(table_promises)
  }
};
