var
  models = require('../models')
, utils = require('../utils');

/**
 * Database enumerations for various lists such
 * tags, meal styles, etc. Implemented with singleton
 * pattern.
 */

// Modify this list to add more enumerations
var tables = ['Tag', 'MealType', 'MealStyle'];

module.exports = (function() {

  // Private data
  var data = {};
  var singleton = {};

  utils.each(tables, function(table) {

    // Retrieve enum data (SELECT * FROM table)
    models[table].find({}, function(err, results) {
      data[table] = utils.invoke(results, 'toJSON');
    });

    // Define singleton getters
    var fn = 'get' + table + 's';
    singleton[fn] = function() {
      return data[table];
    };
  });

  // Expose singleton
  return singleton;
})();
