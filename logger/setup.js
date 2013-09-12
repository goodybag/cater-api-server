
/**
 * Module dependencies
 */

var
  _ = require('lodash')
, extend = require('node.extend')
, winston = require('winston')
, Loggly = require('winston-loggly').Loggly
, gelfEncode = require('gelf-encode')
, UdpClient = require('udp-client')
, microtime = require('microtime')

, config = require('../config')
, FileRotate = require('./file-rotate')
;

/**
 * Create a new logger
 * @param  {Object} options {app: String, component: String}
 * @return {[type]}         [description]
 */
module.exports = function(options){
  var defaults = {
    transports: []
  , meta: {}
  };

  var useGelf = false;
  if (config.logging.enabled && config.logging.transports) {
    if (config.logging.transports.console) {
      defaults.transports.push(
        new (winston.transports.Console)({json: true})
      );
    }

    if (config.logging.transports.fileRotate) {
      defaults.transports.push(
        new FileRotate({
          filename: 'all.log'
        , dirname: 'logs'
        , json: true
        })
      );
    }

    if (config.logging.transports.loggly) {
      defaults.transports.push(new Loggly(config.loggly));
    }

    if(config.logging.transports.devConsole) {
      var DevConsoleTransport = require('./dev-console-transport');
      defaults.transports.push(new DevConsoleTransport());
    }

    if(config.logging.transports.gelf) {
      useGelf = true;
    }
  }

  if(typeof options != 'object') throw new Error('options should be an object including keys for app and component');
  if (options === null) throw new Error('options required');
  if (options.app === null) throw new Error('app is required');

  options = extend(defaults, options);

  if (_.isString(options.app)) options.meta.app = options.app;
  if (_.isString(options.component)) options.meta.component = options.component;

  var logger = new (winston.Logger)(options);

  //export the gelf module for testability
  logger.meta = options.meta;

  //http://www.ypass.net/blog/2012/06/introduction-to-syslog-log-levelspriorities/
  var gelfLevel = {
    debug: 7,
    info: 6,
    notice: 5, //not used
    warn: 4,
    error: 3,
    critical: 2, //not used
    alert: 1, //not used
    emergency: 0, //not use
  };

  var port = 12201;
  var host = '192.168.13.105';
  var app = 'magic';
  if(config.gelf) {
    port = config.gelf.port;
    host = config.gelf.host;
    app = config.gelf.app;
  }

  var buildGelf = function(level, msg, meta) {
    var packet = {
      version: '1.0',
      host: app,
      short_message: msg,
      timestamp: microtime.nowDouble(),
      level: gelfLevel[level],
      facility: meta.component
    };

    for(var key in meta) {
      if(key == 'error') {
        packet.full_message = meta.error.stack;
      } else if(key == 'tags') {
        packet['_tags'] = meta.tags.join(', ');
      } else {
        packet['_' + key] = meta[key];
      }
    }
    return packet;
  };

  var gelfClient = new UdpClient(port, host);
  var sendGelf = function(message) {
    gelfEncode(message, function(err, packets) {
      if(err) return console.log('error encoding gelf', err);
      for(var i = 0; i < packets.length; i++) {
        gelfClient.send(packets[i]);
      }
      logger.emit('gelf', message);
    });
  };

  logger.log = function(level, msg, meta, callback){
    msg = (_.isObject(msg)) ? extend(options.msg, msg) : msg;

    // Have to remove the callback from the argments sent to the winston logger.
    // Doing it this way because the winston logger.log function is retarded at
    // parsing arguments. Also, their internal docs for this are inconsistent
    // with their readme. having a callback that is undefined messes shit up.

    var args = [level, msg, meta, callback];
    if (!callback) args.pop();
    winston.Logger.prototype.log.apply(this, args);

    if(useGelf) {
      var packet = buildGelf(level, msg, meta);
      sendGelf(packet);
    }
  };

  //returns base set of meta
  var baseMeta = function(more) {
    var meta = extend({}, options.meta);
    if(process.domain) {
      meta.domain = process.domain.name;
      var req = process.domain.members[0];
      //if we're on an http request
      if((req||0).url) {
        meta.uuid = req.uuid;
        meta.url = req.url;
        meta.method = req.method;
      }
    }
    return meta;
  };

  var addLevel = function(level) {
    logger[level] = function(tags, msg, meta, callback) {
      var base = baseMeta();
      if(arguments.length < 3) {
        //try to figure out arguments
        if(arguments.length === 1) {
          //log.info({some: 'meta'})
          if(typeof tags == 'object') {
            msg = tags.name || 'OBJECT';
            meta = tags;
            tags = [];
          //log.info('message'); - single message
          } else {
            msg = tags;
            tags = [];
            meta = {};
          }
        }
        else if(arguments.length === 2) {
          if(typeof msg == 'object'){
            //log.info('message', {some: 'meta'})
            if(typeof tags == 'string') {
              meta = msg;
              msg = tags;
              tags = [];
            //log.info(['tag1', 'tag2'], {some: 'meta'});
            } else {
              meta = msg;
              msg = (msg||0).name || JSON.stringify(msg);
            }
          }
        }
      }
      meta = extend(base, meta);
      tags = !_.isArray(tags) ? [tags] : tags;
      meta.tags = tags;

      logger.log(level, msg, meta, callback);
    }
  };
  ['debug', 'info', 'warn', 'error'].forEach(addLevel);
  var logError = logger.error;
  logger.error = function(tags, message, meta) {
    if(tags instanceof Error) {
      return logError('error', tags.message || 'error', { error: tags });
    }
    if(message instanceof Error) {
      return logError(tags, message.message || 'error', { error: message });
    }
    if(meta instanceof Error) {
      return logError(tags, message, {error: meta});
    }
    logError.apply(logError, arguments);
  };

  return logger;
};