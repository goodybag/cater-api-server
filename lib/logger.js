var os      = require('os');
var cluster = require('cluster');
var loglog  = require('loglog');
var config  = require('../config');
var pkg     = require('../package');

var transports = [
  loglog.transports.console()
];

if ( config.logging.mongoConnStr ){
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

var logger = module.exports = loglog.create({
  data: {
    host: {
      name: config.isProduction || config.isStaging
              ? process.env.DYNO
              : os.hostname()
    , pid:  process.pid
    , app: { version: pkg.version }
    }
  }

, transports: transports
});
