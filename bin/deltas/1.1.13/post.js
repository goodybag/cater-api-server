var utils = require('../../../utils');
var models = require('../../../models');
var config = require('../../../config');
var elastic = require('../../../lib/elastic');

elastic.ensureIndex(function(error, result) {
  if (error) {
    console.log(error);
    process.exit();
  }

  models.Restaurant.find({}, function(error, restaurants) {
    if (error) {
      console.error('error finding restaurants');
      process.exit();
    }

    var tasks = [];

    utils.each(restaurants, function (restaurant) {
      restaurant = restaurant.attributes;
      tasks.push(function(callback) {
        elastic.save('restaurant', utils.pick(restaurant, 'id', 'name', 'logo_url'), callback);
      });
    });

    utils.async.parallelLimit(tasks, 2, function(err, results) {
      if (err) 
        console.log('Error:', err);
      else
        console.log(results.length + ' restaurants indexed');
      process.exit();
    });
  });
});
