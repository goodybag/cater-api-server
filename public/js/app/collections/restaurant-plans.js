define(function(require, exports, module) {
  var utils           = require('utils');
  var DeliveryService = require('../models/restaurant-plan');

  return module.exports = utils.Collection.extend({
    model: DeliveryService

  , url: '/api/restaurant-plans'

  , initialize: function( models, options ){
      return this;
    }
  });
});