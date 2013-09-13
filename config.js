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
        console: true
      , devConsole: false
      , fileRotate: false
      , sentry: false
      , loggly: false
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
  , twilio: {
      account: 'AC4ec9863aecd8248803144972fc51bac0'
    , token: 'f45e26c40cd7481c872c3552676b598b'
    }
  , emails: {
      support: 'support@goodybag.com'
    , orders: 'orders@goodybag.com'
    , waitlist: 'waitlist@goodybag.com'
    }
  , phone: {
      main: '5126674224'
    , support: '5122706555'
    , orders: '5122706333'
    }
  }

, dev: {
    env: 'dev'

  , logging: {
      enabled: true
    , transports: {
        devConsole: true
      , fileRotate: true
      , sentry: true
      }
    , sentry: {
        level: 'warn'
      , dsn: 'https://c848c777a63d480fb4af4d680db5b971:36b7e97bd52240dbab3068e6d2337e23@app.getsentry.com/13040'
      , patchGlobal: true
      }
    }

  , http: {
      port: 3000
    }

  , postgresConnStr:  "postgres://localhost:5432/cater"

  , baseUrl: 'http://localhost:3000'

  , testEmail: 'geoff@goodybag.com'

  , testPhoneSms: '5129236299'

  , testPhoneVoice: '5125390612'

  , emailEnabled: true
  }

, staging: {
    env: 'staging'

  , logging: {
      enabled: true
    , transports: {
        loggly: true
      , sentry: true
      }
    , loggly: {
        subdomain:'gbstaging'
      , inputToken: 'e0f6fe9c-8ad3-47ec-9fb2-572aa5ce64dc'
      , auth: {
          username: 'gbstaging'
        , password: 'g00dybag3ng1n33r1ng!'
        }
      }
    , sentry: {
        level: 'warn'
      , dsn: 'https://995cab300c4848f39076fdaf5ef65350:23a0e69b78944d0bbd4821a0cec2d013@app.getsentry.com/12877'
      , patchGlobal: true
      }
    }

  , http: {
      port: process.env['PORT'] || 5000
    }

  , postgresConnStr: process.env['DATABASE_URL']

  , baseUrl: 'http://cater.staging.goodybag.com'
  }
};

var GB_ENV = process.env['GB_ENV'] = process.env['GB_ENV'] || 'dev';
if (GB_ENV == null || !config.hasOwnProperty(GB_ENV)) GB_ENV = 'dev';

module.exports = _.defaults(config[GB_ENV], config.defaults);
console.log('Loading ' + GB_ENV + ' config');
