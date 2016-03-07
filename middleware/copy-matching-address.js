/**
 * m.copyMatchingAddress()
 *
 * Copies details from a user's address to the request body.
 */

var db              = require('../db');
var utils           = require('../utils');
var Address         = require('stamps/addresses')

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    requiredFields: ['street', 'city', 'state', 'zip']
  , fieldsToCopy: {
      street2: 'street2'
    , phone: 'phone'
    , delivery_instructions: 'delivery_instructions'
    , name: 'address_name'
    }
  });

  return function( req, res, next ){
    if ( !options.requiredFields.some( k => k in req.body ) ){
      return next();
    }

    var where = utils.pick( req.body, options.requiredFields )

    // If the order is available on the request, that means we're
    // doing an update to an existing order. In that case, we should
    // pull the user_id from the order rather than the request user
    if ( req.order ){
      where.user_id = req.order.user_id;
    } else if ( !req.user.isGuest() ) {
      where.user_id = req.user.attributes.id;
    } else {
      return next();
    }

    db.addresses.findOne( where, function( error, address ){
      if ( error ){
        req.logger.warn('Error looking up address. Ignoring and continuing', {
          error: error
        });

        return next();
      }

      if ( !address ){
        return next();
      }

      for ( var key in options.fieldsToCopy ){
        if ( key in address ){
          req.body[ options.fieldsToCopy[ key ] ] = address[ key ];
        }
      }

      return next();
    });
  };
};