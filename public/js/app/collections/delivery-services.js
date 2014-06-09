define(function(require, exports, module) {
  var utils           = require('utils');
  var DeliveryService = require('../models/delivery-service');

  return module.exports = utils.Collection.extend({
    model: DeliveryService

  , url: '/api/delivery-services'

  , initialize: function( models, options ){
      return this;
    }
  });
});