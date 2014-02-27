/**
 * Express Afterware
 *
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