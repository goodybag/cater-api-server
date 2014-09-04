var os      = require('os');
var loglog  = require('loglog');
var config  = require('../config');

var logger = module.exports = loglog.create({
  data: {
    host: {
      name: config.isProduction || config.isStaging
              ? process.env.DYNO
              : os.hostname()
    }
  }

, transports: [
    loglog.transports.console()
  , require('loglog-mongodb')({
      connection: config.logging.mongoConnStr
    })
  ]
});