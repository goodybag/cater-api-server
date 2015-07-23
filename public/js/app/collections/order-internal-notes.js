define(function(require, exports, module) {
  var utils = require('utils');
  var Model = require('../models/order-internal-note');

  return module.exports = utils.Collection.extend({
    model: Model

  , comparator: function( a, b ){
      return new Date( b.get('created_at') ) - new Date( a.get('created_at') );
    }

  , url: function(){
      return '/api/orders/:order_id/internal-notes'
        .replace( ':order_id', this.options.order_id );
    }

  , initialize: function( models, options ){
      this.options = options;
      return this;
    }
  });
});