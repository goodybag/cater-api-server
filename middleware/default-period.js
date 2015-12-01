var moment = require('moment-timezone');

var rules = {
  // Increment month by one to match moment's indexing
  month: function( value ){
    return Math.max( 0, Math.min( 12, ++value ) );
  }
};

module.exports = function(intervals) {
  if ( !Array.isArray(intervals) )
    throw new Error('Default Period middleware requires array');

  return function(req, res, next) {
    intervals.forEach(function(interval) {
      if ( req.query[interval] ) return;

      req.query[interval] = moment()[interval]();

      if ( interval in rules ){
        req.query[ interval ] = rules[ interval ]( req.query[ interval ] );
      }
    });

    next();
  };
};
