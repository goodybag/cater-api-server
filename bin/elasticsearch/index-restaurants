var utils = require('../../utils');
var models = require('../../models');
var request = require('request');

models.Restaurant.find({}, function(error, restaurants) {
  if (error) return console.error('error finding restaurants');
  utils.each(restaurants, function (restaurant) {
    restaurant = restaurant.attributes;

    
    // client.index({
    //   index:    'restaurants'
    // , type:     'restaurant'
    // , body: {
    //     id:            restaurant.id
    //   , name:          restaurant.name
    //   , name_suggest:  restaurant.name
    //   }
    // },
    // function (error, response) {
    //   if (error) return console.error('error indexing restaurant', restaurant.id, error);
    //   console.log(response);
    // });
  });
});

