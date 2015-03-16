var moment = require('moment-timezone');
var zeroIndexed = [ 'month', 'hour', 'minute', 'second', 'millisecond' ];

module.exports = function(intervals) {
  if ( !Array.isArray(intervals) )
    throw new Error('Default Period middleware requires array');

  return function(req, res, next) {
    intervals.forEach(function(interval) {
      if ( req.query[interval] ) return;

      if ( zeroIndexed.indexOf(interval) >= 0 )
        req.query[interval] = moment().add(1, interval)[interval]();
      else
        req.query[interval] = moment()[interval]();
    });
    next();
  };
};
