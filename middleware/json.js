var fs = require('fs');
var path = require('path');

/**
 * Read a json file and plug into res.locals
 *
 * @param object opts - An object containing the file to be read 
 *                      and a res.locals target
 */
module.exports = function(opts) {
  if ( typeof opts !== 'object' ) {
    throw new Error( 'JSON middleware requires object' );
  }

  opts = opts || {};
  opts.file = opts.file || '';
  opts.target = opts.target || '';

  return function(req, res, next) {
    fs.readFile( path.join( process.cwd(), opts.file ), function( error, contents) {
      if ( error ) return next( error );

      try {
        res.locals[opts.target] = JSON.parse( contents.toString() );
        next();
      } catch ( e ){
        return next( new Error ('Invalid JSON') );
      }
    });
  };
};
