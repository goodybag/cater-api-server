var utils = require('../../../utils');
var models = require('../../../models');
var request = require('request');
var config = require('../../../config');

models.Restaurant.find({}, function(error, restaurants) {
  if (error) return console.error('error finding restaurants');

  var tasks = [];
  
  utils.each(restaurants, function (restaurant) {
    restaurant = restaurant.attributes;

    var options = {
      uri: config.bonsai.url + '/cater/restaurant/' + restaurant.id
    , method: 'PUT'
    , timeout: 7000
    , json: {
        name: restaurant.name
      , logo_url: restaurant.logo_url
      }
    };

    tasks.push(function(callback) {
      request(options, callback);
    });
  });

  utils.async.parallel(tasks, function(err, results) {
    if (err) 
      console.log('Error:', err);
    else
      console.log(results.length + ' restaurants indexed');

    process.exit();
  });
});
