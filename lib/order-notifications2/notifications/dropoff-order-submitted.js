var moment  = require('moment-timezone');
var config  = require('../../../config');
var utils   = require('../../../utils');
var dropoff = require('../../dropoff');
var Order   = require('stamps/orders');
var Address = require('stamps/addresses');

module.exports = {
  build: function( order, options, logger, callback ){
    order = Order( order );

    var orderLocation = utils.findWhere(
      order.restaurant.locations
    , { id: order.restaurant_location_id }
    );

    var destination = Address( order );
    var origin = Address( orderLocation );

    dropoff.order.estimate({
      origin:           origin.toString({ street2: false })
    , destination:      destination.toString({ street2: false })
    , utc_offset:       order.getPickupDateTime().format('Z')
    , ready_timestamp:  order.getPickupDateTime().valueOf()
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

// TODO:
// Abstract this stuff into an Order Stamp

var locationDropoff = module.exports.locationDropoff = function( loc ){
  var dest = {
    address_line_1: loc.street
  , city:           loc.city
  , state:          loc.state
  , zip:            loc.zip
  , lat:            '' + loc.lat_lng.x
  , lng:            '' + loc.lat_lng.y
  , first_name:     'Goodybag'
  , last_name:      'Goodybag'
  , company_name:   'Goodybag'
  };

  if ( loc.street2 ){
    dest.address_line_2 = loc.street2;
  }

  return dest;
};

var orderDropoffDestination = module.exports.orderDropoffDestination = function( order ){
  var dest = locationDropoff( order );

  if ( order.user.organization ){
    dest.company_name = order.user.organization;
  }

  dest.phone = order.phone;
  dest.email = order.user.email;

  var remarks = orderRemarks( order );  

  if ( remarks ){
    dest.remarks = remarks;
  }

  if ( order.user.name ){
    dest.first_name = order.user.name.split(' ')[0];
    dest.last_name = order.user.name.split(' ').slice(1).join(' ');
  }

  return dest;
};

var orderDropoffOrigin = module.exports.orderDropoffOrigin = function( order ){
  var origin = utils.findWhere(
    order.restaurant.locations
  , { id: order.restaurant_location_id }
  );

  origin = locationDropoff( origin );

  origin.company_name = order.restaurant.name;
  origin.phone = config.phone.orders;
  origin.email = config.emails.orders;

  var remarks = orderRemarks( order );  

  if ( remarks ){
    origin.remarks = remarks;
  }

  return origin;
};

// {
//   quantity:       1
// , weight:         1
// , eta:            '243.1'
// , distance:       '0.062'
// , price:          '19.00'
// , type:           'asap'
// , reference_code: '1000'
// , ready_date:     1420137000000
// }
var orderDropoffDetails = module.exports.orderDropoffDetails = function( order, est ){
  return {
    type:           'asap'
  , quantity:       1
  , weight:         1
  , eta:            est.data.asap.ETA
  , distance:       est.data.asap.Distance
  , price:          est.data.asap.Price
  , ready_date:     Order( order ).getPickupDateTime().valueOf()
  , reference_code: '' + order.id
  };
};

var orderRemarks = module.exports.orderRemarks = function( order ){
  var remarks = [];

  if ( order.notes ){
    remarks.push( 'Notes:\n' + order.notes );
  }

  if ( order.delivery_instructions ){
    remarks.push( 'Delivery Instructions:\n' + order.delivery_instructions );
  }

  return remarks.join('\n\n');
};

var htmlPreview = module.exports.htmlPreview = function( build ){

};