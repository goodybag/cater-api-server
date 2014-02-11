var utils = require('../../utils');
var models = require('../../models');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

models.Restaurant.find({}, function(error, restaurants) {
  if (error) return console.error('error finding restaurants');
  utils.each(restaurants, function (restaurant) {
    restaurant = restaurant.attributes;
    client.index({
      index:    'restaurants'
    , type:     'restaurant'
    , body: {
        id:       restaurant.id
      , name:     restaurant.name
      }
    },
    function (error, response) {
      if (error) return console.error('error indexing restaurant', restaurant.id, error);
      console.log(response);
    });
  });
});

