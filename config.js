/**
 * Module dependencies
 */

var
  os = require('os')
, fs =  require('fs')
, _ = require('lodash')
, balancedConfig = fs.existsSync(__dirname+'/balanced-config.json') ? require('./balanced-config.json') : undefined // used in dev
;

var config = {
  defaults: {
    numWorkers: os.cpus().length

  , logging: {
      enabled: true
    , transports: {
        console: true
      , fileRotate: false
      }
    , console: {
        json: true
      }
    }

  , http: {
      port: 3000
    }

  , pg: {
      poolSize: 5
    }

  , outputActivePoolIds: false

  , baseUrl: 'http://cater.goodybag.com'

  , amazon: {
      awsId: "AKIAJZTPY46ZWGWU5JRQ"
    , awsSecret: "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"
    }

  , mailgun: {
      apiKey: 'key-8ffj79wzb2dda3s6r7u93o4yz07oxxu8'
    , publicApiKey: 'pubkey-45a1-ynm6dw4tmk8egc6izhgqntwir79'
    }

  , twilio: {
      account: 'AC4ec9863aecd8248803144972fc51bac0'
    , token: 'f45e26c40cd7481c872c3552676b598b'
    }

  , bitly: {
      username:'goodybaginc'
    , apiKey: 'R_174d19bb5c13f986cfa863e18a186441'
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

  , phantomjs: {
      process: "phantomjs"
    }

  , receipt: require('./receipt-config')

  , filepicker: {
      key: 'AF52P8LtHSd6VMD07XdOQz'
    }

  , defaultLogo: 'https://www.filepicker.io/api/file/jLhugLRSQAJVdUe88acg'
  , defaultMonoLogo: 'https://www.filepicker.io/api/file/mbhVfKiSRO0W7SMV7Ygv'
  }


, dev: {
    env: 'dev'

  , isDev: true

  , http: {
      port: 3000
    }

  , logging: {
      enabled: true
    , transports: {
        console: true
      , fileRotate: true
      }
    , console: {
        json: true
      }
    , fileRotate: {
        dirname: 'logs'
      , filename: 'all.log'
      , json: true
      }
    }

  , rollbar: {
      accessToken: 'c7f82820e02c4bd7a759015518948ce3'
    }

  , intercom: {
      apiSecret: 'A4NvND_qEf-ksKYhVw-GduUS2ruW2NlC39murXx2'
    , appId: 'qsetwlny'
    }

  , balanced: balancedConfig

  , ironMQ: {
      token: '_2rd5UzCv7_-chOc4rDZ0Y7y74A'
    , projectId: '526990a7f2d1570005000038'
    }

  , baseUrl: 'http://localhost:3000'

  , postgresConnStr:  "postgres://localhost:5432/cater"

  , requestLogger: {
      connStr: "postgres://localhost:5432/cater"
    , table: 'requests'
    , plan: 'month'
    }

  , testEmail: 'geoff@goodybag.com'

  , testPhoneSms: '5129236299'

  , testPhoneVoice: '5125390612'

  , emailEnabled: true

  , receipt: _.extend(
      {}
    , require('./receipt-config')
    , { bucket: 'dev-receipts.goodybag.com' }
    )

  , workers: {
      debit: {
        enqueue: {
          interval: 1000 * 5 // 5 seconds
        }
      }
    }
  }


, staging: {
    env: 'staging'

  , isStaging: true

  , http: {
      port: process.env['PORT'] || 5000
    }

  , logging: {
      enabled: true
    , transports: {
        console: true
      , papertrail: true
      }
    , console: {
        json: true
      , raw: true
      }
    , papertrail: {
        host: 'logs.papertrailapp.com'
      , port: 34830
      }
    }

  , rollbar: {
      accessToken: 'b85e21df4a1746b49d471441dfd70fa0'
    }

  , intercom: {
      apiSecret: 'tumIlUFE__wGfvVxtAyESXRMroQJAz5csfMKULAY'
    , appId: '6bxgiurw'
    }

  , balanced: {
      secret: "ak-test-PuuQnMAqL7pNQ0t9xuMDV3upU2Pz5sLn"
    , marketplaceUri: "/v1/marketplaces/TEST-MP3gr1uHmPi0i42cNhdL4rEs"
    }

  , ironMQ: {
      token: 'M-NmfDgtD66MCHYKTVS3m15BbSA'
    , projectId: '526990bcf2d1570009000035'
    }

  , baseUrl: 'http://cater.staging.goodybag.com'

  , postgresConnStr: process.env['DATABASE_URL']

  , requestLogger: {
      connStr: process.env['HEROKU_POSTGRESQL_SILVER_URL']
    , table: 'requests'
    , plan: 'month'
    }

  , emailEnabled: true

  , receipt: _.extend(
      {}
    , require('./receipt-config')
    , { bucket: 'staging-receipts' }
    )

  , workers: {
      debit: {
        enqueue: {
          interval: 1000 * 5 // 5 seconds
        }
      }
    }
  }

, production: {
    env: 'production'

  , isProduction: true

  , http: {
      port: process.env['PORT'] || 5000
    }

  , logging: {
      enabled: true
    , transports: {
        console: true
      , papertrail: true
      }
    , console: {
        json: true
      , raw: true
      }
    , papertrail: {
        host: 'logs.papertrailapp.com'
      , port: 64774
      }
    }

  , rollbar: {
      accessToken: 'b85e21df4a1746b49d471441dfd70fa0'
    }

  , intercom: {
      apiSecret: '5I1eNUY_F6HKl_Gb15965fr5VgGfNlwny7WmyKZx'
    , appId: '13s9qu57'
    }

  , balanced: {
      secret: "ak-prod-OmLnG7ftnzB145uM4Ycu4YIE0mgPx4eE"
    , marketplaceUri: "/v1/marketplaces/MPwgAAAdaGmk4BhrmL0qkRM"
    }

  , ironMQ: {
      token: 'vr52EAPD-oYRDtZzsqYd0eoDLkI'
    , projectId: '526990cba2b8ed000500002e'
    }

  , baseUrl: 'https://www.goodybag.com'

  , postgresConnStr: process.env['DATABASE_URL']

  , requestLogger: {
      connStr: process.env['HEROKU_POSTGRESQL_PURPLE_URL']
    , table: 'requests'
    , plan: 'month'
    }

  , emails: {
      support: 'support@goodybag.com'
    , orders: 'orders@goodybag.com'
    , waitlist: 'waitlist@goodybag.com'
    , onDeny: ['orders@goodybag.com', 'jag@goodybag.com']
    }

  , emailEnabled: true

  , workers: {
      debit: {
        enqueue: {
          interval: 1000 * 60 * 30 // 30 minutes
        }
      }
    }
  }
};

var GB_ENV = process.env['GB_ENV'] = process.env['GB_ENV'] || 'dev';
if (GB_ENV == null || !config.hasOwnProperty(GB_ENV)) GB_ENV = 'dev';

module.exports = _.defaults(config[GB_ENV], config.defaults);
console.log('Loading ' + GB_ENV + ' config');
