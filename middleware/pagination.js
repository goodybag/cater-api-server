/**
 * Pagination
 * /users?page=5 => offset=150
 * m.get('/users', m.pagination(), m.db.users );
 */

var utils = require('../utils');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    limit:        30
  , allowLimit:   false
  , pageParam:    'page'
  });

  return function( req, res, next ){
    var page = ( req.query[options.pageParam] - 1 ) || 0;

    req.queryOptions.limit = options.allowLimit && req.query.limit
      ? req.query.limit : options.limit;

    if ( req.queryOptions.limit !== 'all' ){
      req.queryOptions.limit = +req.queryOptions.limit;
      req.queryOptions.offset = page * req.queryOptions.limit;
    }

    res.locals[ options.pageParam ] = page + 1;
    res.locals.limit = req.queryOptions.limit;
    res.locals.offset = req.queryOptions.offset;

    next();
  };
};
