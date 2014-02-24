var events      = require('events');
var path        = require('path');
var phantom     = require('./phantom');
var config      = require('../config');
var utils       = require('../utils');
var venter      = require('./venter');

var pms = module.exports  = Object.create( events.EventEmitter.prototype );

pms.processing = {};

// script that phantomjs will call
var script = path.resolve( __dirname, '../', config.pdf.script );

/**
 * Runs the phantomjs script for generating payment summaries. Although its
 * interface is dictated by async.queue, you can bypass the queue
 * and call it directly. Just make sure the first arguments is of the
 * following format:
 *
 * buildpms( { id: pmsId, jobId: ++currentJobId }, callback );
 *
 * @param  {Object}   pms    The task object
 * @param  {Function} callback callback( error, results )
 */
var buildpms = function( pms, callback ){
  if ( !pms.processing[ pms.id ] ) pms.processing[ pms.id ] = {};

  pms.processing[ pms.id ][ pms.jobId ] = true;

  // The output file
  var output = pms.getFullpmsPath( pms.id );

  // The url to hit to build the output
  var input  = config.baseUrl + config.paymentSummaries.pmsRoute.replace(
    ':psid', pms.id
  );

  var args = [
    script
  , '--url',      input
  , '--output',   output
  , '--email',    config.paymentSummaries.credentials.email
  , '--password', config.paymentSummaries.credentials.password
  ];

  phantom.run( args.concat( function( error, results ){
    if ( error ){
      delete pms.processing[ pms.id ][ pms.jobId ];
      return callback( error );
    }

    // Upload the file to s3
    pms.upload( pms.id, function( error ){
      delete pms.processing[ pms.id ][ pms.jobId ];

      if ( error ) return callback( error );

      pms.emit( 'pms:generated', pms.id );
      pms.emit( [ 'pms', pms.id, 'generated' ].join(':') );
      venter.emit( 'pms:generated', pms.id );

      callback( null, results );
    });
  }));
};

var queue = pms.queue = utils.async.queue(
  buildpms, config.paymentSummaries.concurrency
);

// Local queue ID
var currJobId = 0;

/**
 * Hits the pms URL for pmsId and generates the PDF in the
 * folder specified in the config. This is added to a concurrent async
 * queue, and enforces uniqueness for pmsId's on the queue. If an
 * pms comes in that's already on the the queue, we layer on the
 * callback passed to the existing job's callback.
 * @param  {Number}   pmsId  The pmsID to generate
 * @param  {Function} callback callback( error, resultFileName )
 * @return {Number}            The job number on the queue
 */
pms.build = function( pmsId, callback ){
  callback = callback || utils.noop;

  // Ensure the pms is not already in the queue
  var existing = queue.tasks.filter( function( task ){
    return task.data.id === pmsId;
  });

  // If it does exist, just tack on this callback to the existing one
  if ( existing.length > 0 ){
    var oldCallback = existing[0].callback;
    existing[0].callback = function(){
      oldCallback.apply( this, arguments );
      callback.apply( this, arguments );
    };
  }

  queue.push( { id: pmsId, jobId: ++currJobId }, callback );

  return currJobId;
};


/**
 * Is the pms already in the queue
 * @param  {Number} pmsId The pmsID
 * @return {Boolean}        Whether or not it's in the queue
 */
pms.pmsInQueue = function( pmsId ){
  return queue.tasks.some( function( task ){
    return task.data.id === pmsId;
  });
};

/**
 * Is the pms's PDF pms currently building
 * @param  {Number} pmsId The pmsID
 * @return {Boolean}        is building
 */
pms.pmsIsProcessing = function( pmsId ){
  var processing = pms.processing[ pmsId ];

  return (
    typeof processing === 'object'
    && !Array.isArray( processing )
    && Object.keys( processing ).length > 0
  );
};

pms.getDirPath = function(){
  return path.resolve( __dirname, '../', config.paymentSummaries.dir );
}

pms.getFileName = function( pmsId ){
  return config.paymentSummaries.fileName.replace( ':psid', pmsId );
};

pms.getFullpmsPath = function( pmsId ){
  return path.join(
    pms.getDirPath()
  , pms.getFileName( pmsId )
  );
};

pms.getS3Client = function(){
  return utils.s3.createClient({
    key:    config.amazon.awsId
  , secret: config.amazon.awsSecret
  , bucket: config.paymentSummaries.bucket
  });
};

pms.get = function( pmsId, callback ){
  var file = pms.getFileName( pmsId );

  var s3Client = pms.getS3Client();

  s3Client.getFile( '/' + file, callback );
};

pms.upload = function( pmsId, callback ){
  var file = pms.getFullpmsPath( pmsId );

  var s3Client = pms.getS3Client();

  s3Client.putFile( file, '/' + pms.getFileName( pmsId ), callback );
};