/**
 * Orders.Item
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var queries = require('../../../../../db/queries');

  module.exports = require('stampit')()
    .compose( require('./base') )
    .state({

    })
    .methods({
      toPaymentSummaryItem: function(){

      }
    });

  module.exports.requiredOrderQueryOptions = {
    many: [ { table: 'order_items', alias: 'items' }
          , { table: 'order_amenities', alias: 'amenities', mixin: [ { table: 'amenities' } ] }
          ]
  , one:  [ { table: 'users', alias: 'user' }
          , { table: 'delivery_services', alias: 'deliveryService' }
          , { table: 'restaurant_locations', alias: 'location' }
          ]
  };

  return module.exports;
});