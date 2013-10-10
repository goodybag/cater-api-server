/**
 * Adds an orderParams object to request if it's present in the URL
 *
 * ?zip=75189&date=2027-09-03
 */

var moment = require('moment');

// These are the fields we will use to build the orderParams object
var orderParamsFields = [
  'zip'
, 'date'
, 'time'
, 'guests'
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

module.exports = function(){
  return function( req, res, next ){
    // Track previous params if there was something there
    if ( Object.keys( req.session.orderParams ) > 0 ){
      req.session.previousParams = req.session.orderParams;
    }

    // New request, reset orderParams
    req.session.orderParams = {};

    for (var i = 0, l = orderParamsFields.length, key; i < l; ++i){
      key = orderParamsFields[i];

      if ( !req.param( key ) ) continue;

      // Add transformed value
      req.session.orderParams[ key ] = ( key in transforms
        ? transforms[ key ]( req.param( key ), req )
        : req.param( key )
      );
    }

    next();
  };
};