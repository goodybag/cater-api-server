define(function(require, exports, module) {
  var utils = require('utils');
  var Model = require('../models/restaurant-plan');

  return module.exports = utils.Collection.extend({
    model: Model

  , url: '/api/restaurant-plans'

  , initialize: function( models, options ){
      return this;
    }
  });
});