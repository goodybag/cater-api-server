#!/usr/bin/env node
var utils     = require('../../../utils')
  , models    = require('../../../models')
  , db        = require('../../../db')
  , queries   = require('../../../db/queries');

/**
 * The table categories has `name` prefixed with [Group] or [Individual]
 * as a placeholder for multiple menu support. This script will process
 * these `name`s and configure the `menus` column.
 */
var tasks = [
  function getCategories(callback) {
    models.Category.find({limit: 1000}, function(error, rows) {
      if (error) return callback(error);

      console.log('Updating', rows.length, 'categories...');
      var categories = utils.invoke(rows, 'toJSON');
      callback(null, categories);
    });
  },

  function updateCategories(categories, callback) {
    var labels = ['[Group]', '[Individual]', '[ Group ]', '[ Individual ]'];

    var updateTasks = [];
    utils.each(categories, function(cat) {

      // Strip category labels off name
      var menus = [];

      utils.each(labels, function(label) {
        if (cat.name.indexOf(label) >= 0) {
          cat.name = cat.name.replace(label, '').trim();
          menus.push(label.replace(/[\[\]]/g, '"').toLowerCase().trim());
        }
      });

      // Update `name` and `menus` column
      var updates = {
        name: cat.name
      , menus: '{' + menus.join(',') + '}'
      };

      // Default unlabeled categories to group
      if (updates.menus === '{}') {
        updates.menus = '{groups}';
      }

      var query = queries.category.update(updates, cat.id);
      var sql = db.builder.sql(query);
      updateTasks.push(function(next) {
        db.query(sql.query, sql.values, function(error, rows, result) {
          if (error) return next(error);
          next(null);
        });
      });
    });

    var limit = 5;

    // Update in batches 
    utils.async.parallelLimit(updateTasks, limit, function(error, results) {
      if (error) return callback(error);
      callback(null);
    });
  }
];

utils.async.waterfall(tasks, function(error, result) {
  if (error) return console.log(error), console.log(error.stack), process.exit(1);
  console.log('Completed processing category labels and menus');
  process.exit(0);
});