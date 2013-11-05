/**
 * Module dependencies
 */

var
  os = require('os')
, _ = require('lodash')
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

  , postgresConnStr:  "postgres://localhost:5432/cater"

  , requestLogger: {
      connStr: "postgres://localhost:5432/cater"
    , table: 'requests'
    , plan: 'month'
    }

  , baseUrl: 'http://localhost:3000'

  , testEmail: 'preston@goodybag.com'

  , testPhoneSms: '5129236299'

  , testPhoneVoice: '5125390612'

  , emailEnabled: true

  , receipt: _.extend(
      {}
    , require('./receipt-config')
    , { bucket: 'dev-receipts.goodybag.com' }
    )
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
  }
};

var GB_ENV = process.env['GB_ENV'] = process.env['GB_ENV'] || 'dev';
if (GB_ENV == null || !config.hasOwnProperty(GB_ENV)) GB_ENV = 'dev';

module.exports = _.defaults(config[GB_ENV], config.defaults);
console.log('Loading ' + GB_ENV + ' config');
