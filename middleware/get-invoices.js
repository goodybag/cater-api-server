var utils = require('../utils');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    notPending: false
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

    require('stamps/user-invoice').find( where, queryOptions, function( error, results ){
      if ( error ) return next( error );

      res.locals.invoices = results;

      return next();
    });
  }
};
