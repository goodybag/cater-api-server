var os      = require('os');
var cluster = require('cluster');
var loglog  = require('loglog');
var config  = require('../config');
var pkg     = require('../package');

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

, transports: [
    loglog.transports.console()
  , require('loglog-mongodb')({
      connection: config.logging.mongoConnStr
    })
  ]
});