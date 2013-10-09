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
    var datetime = moment();
    var hhmm = d.split(':');
    // datetime.hour( hhmm[0] );
    // datetime.minute( hhmm[1] );

    return datetime.format('hh:mm');
  }
};

module.exports = function(){
  return function( req, res, next ){
    var orderParams = {}, added = false;

    for (var i = 0, l = orderParamsFields.length, key; i < l; ++i){
      key = orderParamsFields[i];

      if ( !req.param( key ) ) continue;

      added = true;

      // Add transformed value
      orderParams[ key ] = ( key in transforms
        ? transforms[ key ]( req.param( key ), req )
        : req.param( key )
      );
    }

    if ( added ) req.session.orderParams = orderParams;

    next();
  };
};