'use strict';

var utils = require('../utils');
var UserInvoice = require('stamps/user-invoice');
var datetime = require('stamps/datetime');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    notPending: false
  , paginate: true
  });

  return function( req, res, next ){
    var queryOptions = {
      order: ['id desc']
    };

    var where = {};

    if ( options.userIdParam && options.userIdParam in req.params ){
      where.user_id = req.params[ options.userIdParam ];
    }

    if ( options.notPending ){
      where.status = { $ne: 'pending' };
    }

    if ( options.paginate ){
      let period = res.locals.period = datetime
        .create({ datetime: req.query.period })
        .getBillingPeriod();

      res.locals.previousPeriod = period.previous();
      res.locals.nextPeriod = period.next();

      let rangeQuery = period.getMosqlRangeQuery();

      where.billing_period_start = { $gte: rangeQuery.$gte };
      where.billing_period_end = { $lt: rangeQuery.$lt };
    }

    UserInvoice.find( where, queryOptions, function( error, results ){
      if ( error ) return next( error );

      res.locals.invoices = results;

      return next();
    });
  };
};
