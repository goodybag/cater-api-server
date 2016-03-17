var moment = require('moment-timezone');
var utils = require('../utils');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    dateFormat: 'YYYY-MM-DD'
    // If set to some period (day|week|month|year)
    // We'll populate the query with the current period
    // example: initialPeriod: 'month' will query for the
    // current month
  , initialPeriod: null
  });

  return function( req, res, next ){
    var timezone = req.user.attributes.region.timezone;

    if ( req.query.start || req.query.end ){
      req.queryObj.datetime = {}
      // If using date range, we want to see all orders in the date range
      // at least until we get pagination aware http clients
      req.queryOptions.limit = 'all';
    }

    if ( req.query.start ){
      req.queryObj.datetime.$gte = moment(
        req.query.start
      ).format( options.dateFormat );
    }

    if ( req.query.end ){
      req.queryObj.datetime.$lt = moment(
        req.query.end
      ).format( options.dateFormat );
    }

    if ( options.initialPeriod && !req.query.start && !req.query.end ){
      var now = moment.tz( timezone ).startOf( options.initialPeriod );

      req.queryObj.datetime = req.queryObj.datetime || {};
      req.queryObj.datetime.$gt = now.format( options.dateFormat );
      req.queryObj.datetime.$gt = now.add( 1, options.initialPeriod ).format( options.dateFormat );
    }

    return next();
  };
};