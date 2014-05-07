var utils   = require('../utils');
var Models  = require('../models');

module.exports = function( options ){
  options = utils.defaults( options, {
    param: 'id'
  });

  return function( req, res, next ){
    var $query = {
      where: { id: req.param( options.param ) }
    };

    Models.Restaurant.findOne( $query, function( error, restaurant ){
      if ( error ) return res.error(500);

      if ( options.withMenuItems ){
        restaurant.getItems( function( error, items ){
          if ( error ) return res.error(500);
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
