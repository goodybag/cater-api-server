var moment  = require('moment-timezone');
var config  = require('../../../config');
var utils   = require('../../../utils');
var dropoff = require('../../dropoff');
var Order   = require('stamps/orders');
var Address = require('stamps/addresses');
var hbs     = require('../../../public/js/lib/hb-helpers');
var pkg     = require('../../../package.json');

module.exports = {
  description: [
    'Submit an order to the DropOff API'
  ].join('')

, historyDataHTML: function( history ){
    if ( !history.data.result ){
      return '';
    }

    if ( history.data.result.status >= 300 ){
      return '<strong class="error">Dropoff sent error code</strong>'
    }

    return [
      '<a href=":order_url" target="_blank">:order_url</a>'
        .replace( /\:order_url/g, history.data.result.data.url )
    ].join('\n')
  }

, build: function( order, options, logger, callback ){
    order = Order( order );

    var destination = Address( order );
    var origin = Address( order.location );

    dropoff.order.estimate({
      origin:           origin.toString({ street2: false })
    , destination:      destination.toString({ street2: false })
    , utc_offset:       order.getPickupDateTime().format('Z')
    , ready_timestamp:  order.getPickupDateTime().unix()
    }, function( error, estimate ){
      if ( error ) return callback( error );

      var build = {
        order: {
          origin:       orderDropoffOrigin( order )
        , destination:  orderDropoffDestination( order )
        , details:      orderDropoffDetails( order, estimate )
        }
      , _origin: origin.toString()
      , _destination: destination.toString()
      };

      if ( options.render !== false ){
        build.html = htmlPreview( build );
      }

      if ( options.legacy !== false ){
        build.to = 'Dropoff API';
        build.from = 'Goodybag';
      }

      return callback( null, build );
    });
  }

, send: function( build, order, options, logger, callback ){
  console.log('dropoff.order.create', build.order);
    dropoff.order.create( build.order, function( error, result ){
      if ( error ){
        console.log( 'Got error', error );

        return callback( error );
      }

      build.result = result;

      console.log( 'Got result', result );

      return callback( null, result );
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
  console.log( order);
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
  var origin = locationDropoff( order.location );
console.log( order.location );
  origin.company_name = order.restaurant.name;
  origin.phone = config.phone.orders;
  origin.email = config.emails.orders;

  var remarks = orderRemarks( order );  

  if ( remarks ){
    origin.remarks = remarks;
  }

  return origin;
};

var orderDropoffDetails = module.exports.orderDropoffDetails = function( order, est ){
  var estDetails = ({
    true:   est.data.asap
  , false:  est.data.after_hr
  })[ 'asap' in est.data ];

  return {
    type:           'asap' in est.data ? 'asap' : 'after_hr'
  , quantity:       1
  , weight:         1
  , eta:            estDetails.ETA
  , distance:       estDetails.Distance
  , price:          estDetails.Price
  , ready_date:     Order( order ).getPickupDateTime().unix()
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
  return [
    '<html>'
  , '<head>'
  , '  <link rel="stylesheet" href=":stylesheet">'
  , '</head>'
  , '<body>'
  , '  <h1>Dropoff API Call</h1>'
  , '  <dl class="definition-row-list">'
  , '  <div class="row">'
  , '    <dt>Origin</dt><dd>:origin</dd>'
  , '  </div>'
  , '  <div class="row">'
  , '    <dt>Destination</dt><dd>:destination</dd>'
  , '  </div>'
  , '  <div class="row">'
  , '    <dt>Reported Price</dt><dd>$:price</dd>'
  , '  </div>'
  , '  <div class="row">'
  , '    <dt>Reference Code</dt><dd>:reference_code</dd>'
  , '  </div>'
  , '  </dl>'
  , '</body>'
  , '</html>'
  ].join('\n')
    .replace( ':stylesheet',
      hbs.cdn( '/dist/:version/css/admin.css'.replace( ':version', pkg.version ), {} )
    )
    .replace( ':origin', build._origin )
    .replace( ':destination', build._destination )
    .replace( ':price', build.order.details.price )
    .replace( ':reference_code', build.order.details.reference_code );
};