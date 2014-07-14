var utils   = require('../utils');
var Models  = require('../models');
var errors  = require('../errors');

module.exports = function( options ){
  options = utils.defaults( options, {
    param: 'id'
  , with_delivery_services: false
  });

  return function( req, res, next ){
    var $query = {
      where: { id: req.param( options.param ) }
    , with_delivery_services: options.with_delivery_services
    };

    Models.Restaurant.findOne( $query, function( error, restaurant ){
      if ( error ) return res.send( 500 );
      if ( !restaurant ) return res.send( 404 );

      if ( options.withMenuItems ){
        restaurant.getItems( function( error, items ){
          if ( error ) return res.send( 500 );
          res.locals.restaurant = restaurant.toJSON();
          next();
        });
      } else {
        res.locals.restaurant = restaurant.toJSON();
        next();
      }
    });
  };
};
