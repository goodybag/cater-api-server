/**
 * Express Afterware
 *
 * Calls `handler` after just before sending back to the client.
 * Parameters are `handler( req, res, next, ... ) where the rest
 * params are whatever was sent to `res.end`.
 *
 * WARNING:
 * By the time you get to this point, res.end has been intiated, but
 * not actually called. So DO NOT call res.send or end again. The
 * res object is passed in simply for data reflection
 *
 * Usage:
 *
 *  // GET /api/users => 2, 3, 1
 *  app.get('/api/users'
 *  , m.after( function( req, res, next ){
 *      console.log(1)
 *      next();
 *    })
 *  , function( req, res, next ){
 *      console.log(2)
 *      next();
 *    }
 *  , function( req, res ){
 *      console.log(3);
 *      res.send(204);
 *    }
 *  );
 */

module.exports = function( handler ){
  return function( req, res, next ){
    var oend = res.end;
    res.end = function(){
      var args = arguments;
      handler.apply( null, [ req, res, function(){
        oend.apply( res, args );
      }].concat( Array.prototype.slice.call( arguments ) ) );
    };
    next();
  };
};