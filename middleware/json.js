/**
 * Read a json file and plug into res.locals
 *
 * @param object opts - An object containing the file to be read 
 *                      and a res.locals target
 */
module.exports = function(opts) {
  return function(req, res, next) {
    if ( typeof opts !== 'object' ) {
      return next( new Error( 'JSON middleware requires object' ) );
    }
    opts = opts || {};
    opts.file = opts.file || '';
    opts.target = opts.target || '';
    res.locals[opts.target] = require(process.cwd() + '/' + opts.file);
    next();
  };
};
