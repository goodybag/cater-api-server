var path      = require('path');
var phantom   = require('../../../lib/phantom');
var config    = require('../../../config');
var utils     = require('../../../utils');
var logger    = require('../../../logger').scheduler;

var script = path.resolve( __dirname, '../../../', config.pdf.script );

module.exports = function( job, done ){
  var missing = [
    'url'
  , 'output'
  , 'email'
  , 'password'
  ].filter( function( required ){
    return !( required in job.data );
  });

  if ( missing.length > 0 ){
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

  phantom.run( args.concat( function( error, results ){
    if ( error ){
      return done( error );
    }

    done();
  }));
};