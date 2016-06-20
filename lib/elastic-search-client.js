var elasticsearch = require('elasticsearch');
var Logger = require('loglog/lib/logger');
var config = require('../config');

Logger.prototype.trace = Logger.prototype.info;
Logger.prototype.warning = Logger.prototype.warn;

module.exports = function(){
  return new elasticsearch.Client({
    host: config.elasticsearch.host
  , log: Logger
  });
};
