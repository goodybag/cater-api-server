/**
 * Send Locals as JSON
 */

module.exports = function( options ){
  return function( req, res ){
    var result = res.locals;

    if ( typeof options === 'string' ){
      result = res.locals[ options ];
    }

    res.json( result );
  };
};