define(function(require, exports, module) {
  var utils = require('utils');
  var Model = require('../models/promo');

  return module.exports = utils.Collection.extend({
    model: Model

  , url: '/api/promos'

  , initialize: function( models, options ){
      return this;
    }
  });
});
