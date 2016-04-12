var utils = require('../../utils');
var db = require('../../db');
var odsChecker = require('order-delivery-service-checker');

module.exports = {
  // Check if the order type needs to change
  'order:items:change':
  function( order, item ){
    if ( ['submitted', 'accepted'].indexOf( order.status ) > -1 ){
      return;
    }

    var logger = this.logger;

    var restaurant = db.cache.restaurants.byId( order.restaurant_id );

    db.orders.findOne( order.id, { submittedDate: true }, function( error, result ){
      if ( error ){
        logger.warn('Error fetching order to check oder type changes', {
          order: { id: req.order.id }
        });
      }

      var why = odsChecker.why(
        utils.extend(
          result
        , { restaurant: restaurant }
        )
      );

      var type = why.length > 0 ? 'courier' : 'delivery';

      if ( result.type !== type ){
        logger.info('Updating order % type because', {
          reasons: why
        });

        db.orders.update( order.id, { type: type }, function( error ){
          if ( error ){
            return logger.warn('Error updating order type', {
              type: type
            , order: { id: req.order.id }
            });
          }

          db.order_revisions.track( order.id, null, 'type-change', function( error ){
            if ( error ){
              logger.warn('Error tracking order revision for type change', {
                type: type
              , order: { id: req.order.id }
              });
            }
          });
        });
      }
    });
  }
}
