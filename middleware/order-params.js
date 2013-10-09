/**
 * Adds an orderParams object to request if it's present in the URL
 *
 * ?zip=75189&date=2027-09-03
 */

var moment = require('moment');

var orderParamsFields = [
  'zip'
, 'date'
, 'time'
, 'guests'
];

var transforms = {
  time: function( d, req ){
    var datetime = moment( '2013-01-01 ' + d );
console.log( '2013-01-01 ' + d, datetime.format('HH:mm') )
    return datetime.format('HH:mm');
  }
};

module.exports = function(){
  return function( req, res, next ){
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