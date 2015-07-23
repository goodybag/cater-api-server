define ( function (require) {

  var React = require('react');
  var utils = require('utils');
  var RestaurantSignup = require('../../../dist/restaurant-signup/index.js');
  var Restaurant = require('../models/restaurant');

  var page = {
    init: function ( options ) {
      var restaurant = new Restaurant({});
      restaurant.url = '/restaurants/join';

      React.render(
        React.createElement(RestaurantSignup, { model: restaurant })
      , document.getElementById('restaurant-signup')
      )
    }
  };

  return page;
});