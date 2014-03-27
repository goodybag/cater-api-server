#!/usr/bin/env node
var utils     = require('../../../utils')
  , models    = require('../../../models')
  , db        = require('../../../db')
  , queries   = require('../../../db/queries');

/**
 * Migrate restaurant contact info to separate `contacts` table
 */
var tasks = [
  function getRestaurants(callback) {
    models.Restaurant.find({}, function(error, restaurants) {
      callback(error, restaurants);
    });
  },

  function insertContacts(restaurants, callback) {
    var insertTasks = [];
    restaurants.forEach(function(restaurant) {
      var copyColumns = ['sms_phones', 'voice_phones', 'emails'];
      var values = utils.extend({
        name: 'Restaurant'
      , notes: 'Original admin panel contact info'
      , notify: true
      , restaurant_id: restaurant.attributes.id
      }, utils.pick(restaurant.attributes, copyColumns)
      );
      var query = {
        type: 'insert'
      , table: 'contacts'
      , values: values
      };
      var sql = db.builder.sql(query);
      insertTasks.push(function(next) {
        db.query(sql.query, sql.values, function(error, rows, result) {
          if (error) return next(error);
          next(null);
        });
      });
    });
    var limit = 5;

    // insert in batches
    utils.async.parallelLimit(insertTasks, limit, function(error, results) {
      if (error) return callback(error);
      console.log(results.length, 'restaurants migrated contact info');
      callback(null, restaurants);
    });
  },

  function cleanRestaurants(restaurants, callback) {
    // alter table
    var query = {
      type: 'alter-table'
    , table: 'restaurants'
    , action: {
        dropColumn:
          { name: 'sms_phones' }
        // , { name: 'voice_phones' }
        // , { name: 'emails' }
      }
    };
    var sql = db.builder.sql(query);
    db.query(sql.query, sql.values, function(error, rows, result) {
      return callback(error);
    });
  }
];

utils.async.waterfall(tasks, function(error, result) {
  if (error) return console.log(error), console.log(error.stack), process.exit(1);
  console.log('Completed migrating restaurant contact info');
  process.exit(0);
});
