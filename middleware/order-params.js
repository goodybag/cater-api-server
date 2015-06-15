/**
 * Adds an orderParams object to request if it's present in the URL
 *
 * ?zip=75189&date=2027-09-03&11:30am
 */

var moment = require('moment');

// These are the fields we will use to build the orderParams object
var orderParamsFields = [
  'zip'
, 'date'
, 'time'
, 'guests'
, 'diets'
, 'cuisines'
, 'prices'
, 'mealTypes'
];

// As we get the fields from req.param, run the corresponding
// transform function to get a new value
var transforms = {
  // Return time formatted as HH:mm so user can enter
  // time as 12:00 am or 00:00
  time: function( d ){
    // Just use some random day since we're just concerned with
    // formatting time
    var datetime = moment( '2013-01-01 ' + d );
    return datetime.format('HH:mm');
  }
};

// Override the order params with what's in the query params
// Playing around with the flows, I think this provides the most
// consistent "feeling" behavior.
module.exports = function(){
  return function( req, res, next ){
    var orderParams = {};

    for ( var i = 0, l = orderParamsFields.length, key; i < l; ++i ){
      key = orderParamsFields[i];

      if ( !req.params[key] ) continue;

      // Add transformed value
      orderParams[ key ] = ( key in transforms
        ? transforms[ key ]( req.params[ key ], req )
        : req.params[ key ]
      );
    }

    req.session.orderParams = orderParams;

    // Always attach current orderParams to request though
    req.orderParams = orderParams;

    next();
  };
};
