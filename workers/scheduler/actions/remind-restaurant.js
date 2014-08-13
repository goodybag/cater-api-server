var path      = require('path');
var config    = require('../../../config');
var utils     = require('../../../utils');
var slogger   = require('../../../logger').scheduler;
var helpers   = require('../../../public/js/lib/hb-helpers');
var db        = require('../../../db');

module.exports = function( job, done ){
  var TAGS = [ 'remind-restaurant', 'job-' + job.id ];
  var logger = {};

  [ 'debug', 'info', 'warn', 'error' ].forEach( function( level ){
    logger[ level ] = slogger[ level ].bind( slogger, TAGS );
  });

  logger.info( 'Reminding restaurant', job );
  done();
};