/**
 * Query Inspector
 * Adds a header to the response that allows us to see what the
 * MoSQL query object on the request looked as the response ended
 */

module.exports = function( options ){
  return function( req, res, next ){
    if ( !req.params.query_inspector ) return next();

    var oend = res.end;

    res.end = function(){
      res.header(
        'Query-Inspector'
      , JSON.stringify( utils.extend( { where: req.queryObj }, req.queryOptions ) )
      );

      return oend.apply( res, arguments );
    };

    next();
  }
};
