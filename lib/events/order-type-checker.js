var utils = require('../../utils');
var db = require('../../db');
var odsChecker = require('order-delivery-service-checker');

module.exports = {
  // Check if the order type needs to change
  'order:items:change':
  function( order, item ){
    var logger = this.logger;

    var restaurant = db.cache.restaurants.byId( order.restaurant_id );

    db.orders.findOne( order.id, function( error, result ){
      if ( error ){
        logger.warn('Error fetching order to check oder type changes', {
          order: { id: req.order.id }
        });
      }

      var type = odsChecker.check(
        utils.extend(
          result
        , { restaurant: restaurant }
        )
      ) ? 'courier' : 'delivery';
      if ( result.type !== type ){
        db.orders.update( order.id, { type: type }, function( error ){
          if ( error ){
            logger.warn('Error updating order type', {
              type: type
            , order: { id: req.order.id }
            });
          }
        });
      }
    });
  }
}