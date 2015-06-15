var utils   = require('../utils');
var Models  = require('../models');

module.exports = function( options ){
  options = utils.defaults( options, {
    param: 'id'
  , with_delivery_services: false
  });

  return function( req, res, next ){
    var $query = {
      where: { id: req.params[options.param] }
    , with_delivery_services: options.with_delivery_services
    };

    Models.Restaurant.findOne( $query, function( error, restaurant ){
      if ( error ) return res.send( 500 );
      if ( !restaurant ) return res.send( 404 );

      // return all menu items, this includes hidden items and categories
      if ( options.withMenuItems ){
        var query = {
          where: {
            is_hidden: { $or: [true, false] }
          }
        };
        restaurant.getItems(query, { withHiddenCategories: true }, function( error, items ){
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
