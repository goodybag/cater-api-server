var receipt = require('../lib/receipt');

module.exports = function(){
  return function( req, res, next ){
    if ( !req.param('oid') ) return next();

    receipt.build( +req.param('oid'), function( error, result ){
      console.log(error, result);
      next();
    });
  }
};