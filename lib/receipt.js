var events      = require('events');
var path        = require('path');
var phantom     = require('./phantom');
var config      = require('../config');
var utils       = require('../utils');
var venter      = require('./venter');

var receipt = module.exports  = Object.create( events.EventEmitter.prototype );

receipt.processing = {};

// script that phantomjs will call
var script = path.resolve( __dirname, '../', config.pdf.script );

/**
 * Runs the phantomjs script for generating receipts. Although its
 * interface is dictated by async.queue, you can bypass the queue
 * and call it directly. Just make sure the first arguments is of the
 * following format:
 *
 * buildReceipt( { id: orderId, jobId: ++currentJobId }, callback );
 *
 * @param  {Object}   order    The task object
 * @param  {Function} callback callback( error, results )
 */
var buildReceipt = function( order, callback ){
  if ( !receipt.processing[ order.id ] ) receipt.processing[ order.id ] = {};

  receipt.processing[ order.id ][ order.jobId ] = true;

  // The output file
  var output = receipt.getFullOrderPath( order.id );

  // The url to hit to build the output
  var input  = config.baseUrl + config.receipt.orderRoute.replace(
    ':oid', order.id
  );

  var args = [
    script
  , '--url',      input
  , '--output',   output
  , '--email',    config.receipt.credentials.email
  , '--password', config.receipt.credentials.password
  ];

  phantom.run( args.concat( function( error, results ){
    if ( error ){
      delete receipt.processing[ order.id ][ order.jobId ];
      return callback( error );
    }

    // Upload the file to s3
    receipt.upload( order.id, function( error ){
      delete receipt.processing[ order.id ][ order.jobId ];

      if ( error ) return callback( error );

      receipt.emit( 'receipt:generated', order.id );
      receipt.emit( [ 'receipt', order.id, 'generated' ].join(':') );
      venter.emit( 'receipt:generated', order.id );

      callback( null, results );
    });
  }));
};

var queue = receipt.queue = utils.async.queue(
  buildReceipt, config.receipt.concurrency
);

// Local queue ID
var currJobId = 0;

/**
 * Hits the receipt URL for orderId and generates the PDF in the
 * folder specified in the config. This is added to a concurrent async
 * queue, and enforces uniqueness for orderId's on the queue. If an
 * order comes in that's already on the the queue, we layer on the
 * callback passed to the existing job's callback.
 * @param  {Number}   orderId  The orderID to generate
 * @param  {Function} callback callback( error, resultFileName )
 * @return {Number}            The job number on the queue
 */
receipt.build = function( orderId, callback ){
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

  queue.push( { id: orderId, jobId: ++currJobId }, callback );

  return currJobId;
};


/**
 * Is the order already in the queue
 * @param  {Number} orderId The orderID
 * @return {Boolean}        Whether or not it's in the queue
 */
receipt.orderInQueue = function( orderId ){
  return queue.tasks.some( function( task ){
    return task.data.id === orderId;
  });
};

/**
 * Is the order's PDF receipt currently building
 * @param  {Number} orderId The orderID
 * @return {Boolean}        is building
 */
receipt.orderIsProcessing = function( orderId ){
  var processing = receipt.processing[ orderId ];

  return (
    typeof processing === 'object'
    && !Array.isArray( processing )
    && Object.keys( processing ).length > 0
  );
};

receipt.getDirPath = function(){
  return path.resolve( __dirname, '../', config.receipt.dir );
}

receipt.getFileName = function( orderId ){
  return config.receipt.fileName.replace( ':oid', orderId );
};

receipt.getFullOrderPath = function( orderId ){
  return path.join(
    receipt.getDirPath()
  , receipt.getFileName( orderId )
  );
};

receipt.getS3Client = function(){
  return utils.s3.createClient({
    key:    config.amazon.awsId
  , secret: config.amazon.awsSecret
  , bucket: config.receipt.bucket
  });
};

receipt.get = function( orderId, callback ){
  var file = receipt.getFileName( orderId );

  var s3Client = receipt.getS3Client();

  s3Client.getFile( '/' + file, callback );
};

receipt.upload = function( orderId, callback ){
  var file = receipt.getFullOrderPath( orderId );

  var s3Client = receipt.getS3Client();

  s3Client.putFile( file, '/' + receipt.getFileName( orderId ), callback );
};