var moment  = require('moment-timezone');
var config  = require('../../../config');
var utils   = require('../../../utils');
var dropoff = require('../../dropoff');
var Address = require('stamps/addresses');

function locationDropoff( loc ){
  var dest = {
    address_line_1: loc.street
  , city:           loc.city
  , state:          loc.state
  , zip:            loc.zip
  , lat:            loc.lat_lng.x
  , lng:            loc.lat_lng.y
  };

  if ( loc.street2 ){
    dest.address_line_2 = loc.street2;
  }

  return dest;
}

function orderDropoffDestination( order ){
  var dest = locationDestination( order );

  if ( order.user.organization ){
    dest.company_name = order.user.organization;
  }

  dest.phone = order.phone;

  var remarks = [];

  if ( order.notes ){
    remarks.push( 'Notes:\n' + order.notes );
  }

  if ( order.delivery_instructions ){
    remarks.push( 'Delivery Instructions:\n' + order.delivery_instructions );
  }

  if ( remarks.length ){
    dest.remarks = remarks.join('\n\n');
  }

  return dest;
}

function orderDropoffOrigin( order ){

}

function orderDropoffDetails( order ){

}

function htmlPreview( build ){

}

module.exports = {
  build: function( order, options, logger, callback ){
    var orderLocation = utils.findWhere(
      order.restaurant.locations
    , { id: order.restaurant_location_id }
    );

    var destination = Address( order );
    var origin = Address( orderLocation );

    var orderDate = moment.tz( order.pickup_datetime, order.timezone );

    dropoff.order.estimate({
      origin:           origin.toString({ street2: false })
    , destination:      destination.toString({ street2: false })
    , utc_offset:       orderDate.format('Z')
    , ready_timestamp:  orderDate.valueOf()
    }, function( error, estimate ){
      if ( error ) return callback( error );

      var build = {
        order: {
          origin:       orderDropoffOrigin( order )
        , destination:  orderDropoffDestination( order )
        , details:      orderDropoffDetails( order )
        }
      , _order: order
      };

      if ( options.render !== false ){
        build.html = htmlPreview( build );
      }

      return callback( null, build );
    });
  }

, send: function( build, order, options, logger, callback ){
    dropoff.order.create( build.order, function( error, result ){

    });
  }
};