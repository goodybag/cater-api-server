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
    var page = ( req.params[options.pageParam] - 1 ) || 0;

    req.queryOptions.limit = options.allowLimit && req.params.limit
      ? req.params.limit : options.limit;

    req.queryOptions.offset = page * req.queryOptions.limit;

    res.locals[ options.pageParam ] = page + 1;

    next();
  };
};
