var path        = require('path');
var phantom     = require('./phantom');
var config      = require('../config');
var utils       = require('../utils');

// script that phantomjs will call
var script = path.resolve( __dirname, '../', config.receipt.script );

var buildReceipt = function( order, callback ){
  // The output file
  var output = path.resolve(
    __dirname, '../'
  , config.receipt.dir
  , config.receipt.fileName.replace( ':id', order.id )
  );

  // The url to hit to build the output
  var input  = config.baseUrl + config.receipt.orderRoute.replace(
    ':id', order.id
  );

  phantom.run( script, input, output, function( error, results ){
    if ( error ) return callback( error );
    console.log("FINISHED ORDER #" + order.id)
    callback( null, results );
  });
};

var queue = utils.async.queue( buildReceipt , config.receipt.concurrency );

/**
 * Hits the receipt URL for orderId and generates the PDF in the
 * folder specified in the config. This is added to a concurrent async
 * queue, and enforces uniqueness for orderId's on the queue. If an
 * order comes in that's already on the the queue, we layer on the
 * callback passed to the existing job's callback.
 * @param  {Number}   orderId  The orderID to generate
 * @param  {Function} callback callback( error, resultFileName )
 */
module.exports.build = function( orderId, callback ){
  console.log("Building Receipt for Order #" + orderId);

  callback = callback || utils.noop;

  // Ensure the order is not already in the queue
  var existing = queue.tasks.filter( function( task ){
    return task.data.id === orderId;
  });

  // If it does exist, just tack on this callback to the existing one
  if ( existing.length > 0 ){
    var oldCallback = existing[0].callback;
    existing[0].callback = function(){
      oldCallback.apply( this, arguments );
      callback.apply( this, arguments );
    };
  }

  queue.push( { id: orderId }, callback );
};