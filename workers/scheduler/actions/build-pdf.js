var path      = require('path');
var phantom   = require('../../../lib/phantom');
var config    = require('../../../config');
var utils     = require('../../../utils');
var slogger   = require('../../../logger').scheduler;

var script = path.resolve( __dirname, '../../../', config.pdf.script );

module.exports = function( job, done ){
  var TAGS = [ 'build-pdf', 'job-' + job.id ];
  var logger = {};

  [ 'debug', 'info', 'warn', 'error' ].forEach( function( level ){
    logger[ level ] = slogger[ level ].bind( slogger, TAGS );
  });

  logger.info( 'Building PDF', job );

  var missing = [
    'url'
  , 'output'
  , 'email'
  , 'password'
  ].filter( function( required ){
    return !( required in job.data );
  });

  if ( missing.length > 0 ){
    logger.warn( 'Missing required fields: ' + missing.join(', '), { missing: missing } );

    return done({
      message: 'Missing required fields: ' + missing.join(', ')
    , details: missing
    });
  }

  // Required args
  var args = [
    script
  , '--url',      job.data.url
  , '--output',   job.data.output
  , '--email',    job.data.email
  , '--password', job.data.password
  ];

  // Other acceptable/optional args
  [
    'margin-top'
  , 'margin-right'
  , 'margin-bottom'
  , 'margin-left'
  ].forEach( function( prop ){
    if ( prop in job.data ){
      args.push( '--' + prop, job.data[ prop ] );
    }
  });

  logger.info( 'Running phantomjs with:', { args: args } );

  phantom.run( args.concat( function( error, results ){
    if ( error ){
      logger.error( 'Phantom had an error! ', error );
      return done( error );
    }

    done();
  }));
};