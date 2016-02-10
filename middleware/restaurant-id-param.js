/**
 * Restaurant ID Param
 *
 * Handles setting the where conditional clause on the request
 * query. This can handle the restaurant's id or text_id field.
 */

module.exports = function( name, options ){
  options = options || {};

  return function( req, res, next ){
    module.exports.applyValueToWhereClause( req.params[ name ], req.queryObj );

    if ( options.joinFrom ){
      req.queryOptions.joins = req.queryOptions.joins || [];
      req.queryOptions.joins.push(
        module.exports.getJoinFrom( options.joinFrom, name )
      )
    }

    return next();
  };
};

module.exports.applyValueToWhereClause = function( value, where ){
  where = where || {};

  if ( isNaN( +value ) ){
    where['restaurants.text_id'] = value;
  } else {
    where['restaurants.id'] = value;
  }

  return where;
};

module.exports.getJoinFrom = function( origin, originColumn ){
  originColumn = originColumn || 'restaurant_id';

  return {
    type: 'left'
  , target: 'restaurants'
  , on: { id: `$${origin}.${originColumn}$` }
  }
};