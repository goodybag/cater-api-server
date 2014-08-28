var http = require('http');
var cluster = require('cluster');
var loglog  = require('loglog');
var config  = require('../config');

var logger = module.exports = loglog.create( 'App', {
  transports: [
    loglog.transports.console()
  , require('loglog-mongodb')({
      connection: config.logging.mongoConnStr
    })
  , require('loglog-node-chrome')({
      port: 8081
    })
  ]
});