var os      = require('os');
var cluster = require('cluster');
var loglog  = require('loglog');
var config  = require('../config');
var pkg     = require('../package');

var transports = [];

if ( config.logging.transports.console ) {
  transports.push(loglog.transports.console({
    maxDataLines: -1
  }));
}

if ( config.logging.transports.mongo  ){
  transports.push(
    require('loglog-mongodb')({
      connection: config.logging.mongoConnStr
    })
  );
}

if ( config.logging.transports.rollbar ){
  transports.push(
    require('loglog-rollbar')({
      accessToken: config.rollbar.accessToken
    })
  )
}

if ( config.logging.transports.loggly ){
  transports.push(
    require('loglog-loggly')({
      token:      config.credentials['loggly.com'].token
    , subdomain:  config.credentials['loggly.com'].subdomain
    })
  )
}

var logger = module.exports = loglog
  .create('cater')
  .create( process.env.GB_ENV || 'dev', {
    data: {
      host: {
        name: config.isProduction || config.isStaging
                ? process.env.DYNO
                : os.hostname()
      , pid:  process.pid
      , app: { version: pkg.version }
      }
    }

  , debug: !!+process.env['GB_DEBUG']

  , transports: transports
  });