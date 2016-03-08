var db = require('../db');
var utils = require('../utils');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    description: 'update'
  , orderIdPath: 'req.order.id'
  , actorIdPath: 'req.user.attributes.id'
  });

  return function( req, res, next ){
    var reqRes = { req: req, res: res };
    var orderId = utils.getProperty( reqRes, options.orderIdPath );
    var actorId = utils.getProperty( reqRes, options.actorIdPath );

    db.order_revisions.track( orderId, actorId, options.description, function( error ){
      if ( error ){
        req.logger.warn('Error tracking order revision', {
          order: { id: order.id }
        , error: error
        });
      }
    });

    return next();
  };
};