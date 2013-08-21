
/**
 * Module dependencies
 */

var
  os = require('os')
, _ = require('lodash')
;

var config = {
  defaults: {
    logging: {
      enabled: true
    , transports: {
        console: false
      , fileRotate: true
      }
    }
  , http: {
      port: 3000
    }
  , pg: {
      poolSize: 5
    }
  , numWorkers: os.cpus().length
  , outputActivePoolIds: false

  , amazon: {
      awsId: "AKIAJZTPY46ZWGWU5JRQ"
    , awsSecret: "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"
    }
  , baseUrl: 'http://cater.goodybag.com'
  , mailgun: {
      apiKey: 'key-8ffj79wzb2dda3s6r7u93o4yz07oxxu8'
    , publicApiKey: 'pubkey-45a1-ynm6dw4tmk8egc6izhgqntwir79'
    }
  , emails: {
      support: 'support@goodybag.com'
    , orders: 'orders@goodybag.com'
    , waitlist: 'waitlist@goodybag.com'
    }
  }

, dev: {
    http: {
      port: 3000
    }

  , logging: {
      enabled: true
    , transports: {
        devConsole: true
      }
    }
  , postgresConnStr:  "postgres://localhost:5432/cater"
  , baseUrl: 'http://localhost:3000'

  , emailEnabled: false
  }
};

var GB_ENV = process.env['GB_ENV'] = process.env['GB_ENV'] || 'dev';
if (GB_ENV == null || !config.hasOwnProperty(GB_ENV)) GB_ENV = 'dev';

module.exports = _.defaults(config[GB_ENV], config.defaults);
console.log('Loading ' + GB_ENV + ' config');
