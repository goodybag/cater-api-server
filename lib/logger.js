var os      = require('os');
var cluster = require('cluster');
var loglog  = require('loglog');
var config  = require('../config');

var logger = module.exports = loglog.create({
  data: {
    host: {
      name: config.isProduction || config.isStaging
              ? process.env.DYNO
              : os.hostname()
    , pid:  process.pid
    }
  }

, transports: [
    loglog.transports.console()
  , require('loglog-mongodb')({
      connection: config.logging.mongoConnStr
    })
  ]
});