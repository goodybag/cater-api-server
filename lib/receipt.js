var path        = require('path');
var phantom     = require('./phantom');
var config      = require('../config');

/**
 * Hits the receipt URL for orderId and generates the PDF in the
 * folder specified in the config
 * @param  {Number}   orderId  The orderID to generate
 * @param  {Function} callback callback( error, resultFileName )
 */
module.exports.build = function( orderId, callback ){
  // Get script that phantomjs will call
  var script = path.resolve( __dirname, '../', config.receipt.script );
  // The output file
  var output = path.resolve( __dirname, '../', config.receipt.dir, 'order-' + orderId + '.pdf' );
  // The url to hit to build the output
  var input  = config.baseUrl + config.receipt.orderRoute.replace(
    ':oid', orderId
  );
console.log(script, input, output)
  phantom.run( script, input, output, function( error, results ){
    if ( error ) return callback( error );
console.log("ohai", results)
    callback( null, results );
  });
};