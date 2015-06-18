"use strict";
Promise = require('bluebird')

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("FullSyncBeforeDate", {
    date: {
      type: DataTypes.DATE
    }
  }, {
    timestamps: true,
    classMethods: {
      getOrCreate: function() {
        return this.find({order: '"createdAt" DESC'}).then( function(result) {
          if (!result) {
            this.build({
              date: new Date(0)
            }).save()
          }
          return result ? result.date : new Date(0)
        });
      }
    }
  });
};
