/**
 * Module dependencies
 */

process.env.GB_ENV = process.env.GB_ENV || 'dev';

var
  os = require('os')
, fs =  require('fs')
, _ = require('lodash')
, balancedConfig = fs.existsSync(__dirname+'/balanced-config.json') ? require('./balanced-config.json') : require('./balanced-test-config.json') // used in dev
, local = {}
, pdf = require('./pdf-config')
;

if (fs.existsSync('./local-config.json')){
  local = require('./local-config.json');
}

var config = {};

config.defaults = {
  numWorkers: local.numWorkers || os.cpus().length

, credentials: require('./configs/credentials')
, stores: require('./configs/stores')
, adroll: require('./configs/adroll')
, stripe: require('./configs/stripe')
, google: require('./configs/google')
, intercom: require('./configs/intercom')
, yelp: require('./configs/yelp')
, popularity: require('./configs/popularity')
, reminders: require('./configs/reminders')
, redis: require('./configs/redis')
, session: require('./configs/session')
, diets: require('./public/js/lib/diets')
, sortQueryTable: require('./configs/sort-query-table')
, support: require('./configs/support')
, workers: require('./configs/workers')
, scheduler: require('./configs/scheduler')
, availableRestaurantPlanTypes: ['tiered', 'flat']
, logging: require('./configs/logging')
, invoice: require('./configs/invoice')
, promo: require('./configs/promo')
, hipchat: require('./configs/hipchat')

, deliveryTime: {
    padding: 15
  , distribution: {
      before: [ 0, 1 ]
    , after:  [ 1, 1 ]
    }
  }

, disallowOrdersBetween: {
    start:  { hour: 20, minute: 0 }
  , end:    { hour: 8, minute: 30 }
  }

, emailProvider: 'mandrill'

, tmpDir: './tmp'

, notableUserIds: [ 1944 ] // Send various notifications to Om based on user actions
, notableUserWarningRecipient: [ local.testEmail || 'test@goodybag.com' ]

, geoipUrl: 'http://freegeoip.net/json/:ip'
, geoTestIp: '216.201.168.18'

, restaurantRequestRecipients: [
    local.testEmail || 'test@goodybag.com'
  ]

, deniedRecipients: [
    'jag@goodybag.com'
  , 'christymedlock@goodybag.com'
  , 'patrickmugavin@goodybag.com'
  , 'om@goodybag.com'
  // , 'jay@goodybag.com'
  , 'jacob.parker@goodybag.com'
  ]

, deliveryServiceOrderAboveThresholdRecipients: [
    'jag@goodybag.com'
  , 'christymedlock@goodybag.com'
  , 'patrickmugavin@goodybag.com'
  , 'om@goodybag.com'
  // , 'jay@goodybag.com'
  , 'jacob.parker@goodybag.com'
  , 'alexlauzon@goodybag.com'
  ]

, resultsTooFewContactUsThreshold: 5

, cdn: {
    baseUrl: 'http://localhost:3000'
    // If you want to test out uploading stuff to a CDN, but don't want
    // to use staging or prod, you can uncomment out this line
    // baseUrl: 'http://cater-cdn-dev.s3-website-us-east-1.amazonaws.com'
  , bucket: 'cater-cdn-dev'
  }

, rewardsStartDate: '2014-03-25 00:00:00'

, paymentFailedStartDate: '2014-10-20 00:00:00'

// temp solution, would be better in a table
// , rewardsPromos: [
//     { start: '2014-04-21 00:00:00', end: '2014-04-22 00:00:00', rate: 2.0 }
//   , { start: '2014-04-28 00:00:00', end: '2014-04-29 00:00:00', rate: 2.0 }
//   , { start: '2014-05-05 00:00:00', end: '2014-05-06 00:00:00', rate: 2.0 }
//   , { start: '2014-05-12 00:00:00', end: '2014-05-13 00:00:00', rate: 2.0 }
//   , { start: '2014-05-19 00:00:00', end: '2014-05-20 00:00:00', rate: 2.0 }
//   , { start: '2014-05-27 00:00:00', end: '2014-05-28 00:00:00', rate: 2.0 }
//   , { start: '2014-06-02 00:00:00', end: '2014-06-03 00:00:00', rate: 2.0 }
//   , { start: '2014-06-09 00:00:00', end: '2014-06-10 00:00:00', rate: 2.0 }
//   , { start: '2014-06-16 00:00:00', end: '2014-06-17 00:00:00', rate: 2.0 }
//   ]
, rewardsPromo: {
    start: '2014-04-21 00:00:00'
  , rate: '2.0'
  }

, rewardHolidays: [
    { start: '2014-09-02 00:00:00', end: '2014-09-03 00:00:00', rate: '2.0', description: 'Post-Labor Day' }
  , { start: '2015-05-26 00:00:00', end: '2015-05-27 00:00:00', rate: '2.0', description: 'Post-Memorial Day' }
  ]

, welcome: {
    from:           'christymedlock@goodybag.com'
  , subject:        'Hi there!'
  , template:       'emails/welcome-christy'
  , beginTime:      '09:04'
  , endTime:        '18:00'
  , delay:          (9*60*1000)
  , timezone:       'America/Chicago'
  , days:           [ 1, 2, 3, 4, 5 ]
  , isEnabled:      false
  }

, pagination: {
    limit: 20
  }

, salesTax: 1.0825

, taxRate: .0825

, http: {
    port: 3000
  , timeout: 8000
  }

, pg: {
    poolSize: 5
  }

, expires: {
    shareLink: 1 // day
  }

, facebook: {
    pixel: {
      checkout: '6014846877254'
    , register: '6014846856854'
    , restaurantList: '6014846900654'
    }
  }

, notifications: {
    // appropriate hours to send notifications
    // 7am-12am relative to order timezone
    start: 7
  , end: 24
  }

, deliveryServices: {
    responseThresholdMins: 30
  , supportPhones: [ local.testPhoneSms || '1234567890' ]
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

, mandrill: {
    apiKey: 'dpZRzRo0ZAIpfAAQ2JL5pg'
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
    support: [ local.testEmail || 'test@goodybag.com' ]
  , tech: [ local.testEmail || 'test@goodybag.com' ]
  , orders: 'orders@goodybag.com'
  , waitlist: 'waitlist@goodybag.com'
  , info: 'info@goodybag.com'
  , welcome: 'jacobparker@goodybag.com'
  , rewards: [ local.testEmail || 'test@goodybag.com' ]
  , dsOrders: [ local.testEmail || 'test@goodybag.com' ]
  , reminderIgnored: [ local.testEmail || 'test@goodybag.com' ]
  , orderNotificationChecks: [ local.testEmail || 'test@goodybag.com' ]
  , reminderPaymentStatusIgnore: [local.testEmail || 'test@goodybag.com']
  }

, phone: {
    main: '5126674224'
  , support: '5122706555'
  , orders: '5122706333'
  }

, contact: {
    facebook: 'https://www.facebook.com/GoodybagATX'
  , twitter: 'https://twitter.com/GoodybagATX'
  , linkedin: 'http://www.linkedin.com/company/goodybag-inc'
  }

, phantomjs: {
    process: "phantomjs"
  }

, pdf: pdf

, paymentSummaries: {
    fileName:     "payment-summary-:psid.pdf"
  , concurrency:  10
  , bucket:       "pms.goodybag.com"
  , credentials: {
      email:      "pms@goodybag.com"
    , password:   "G00dyb4agp333m3ss"
    }
  , route:        '/admin/restaurants/:restaurant_id/payment-summaries/:id/pdf'
  , dir:          'tmp'
  }

, receipt: {
    dir:          "public/receipts"
  , fileName:     "order-:oid.pdf"
  , orderRoute:   "/orders/:oid/receipt"
  , bucket:       "receipts.goodybag.com"
  , concurrency:  10
  , credentials: {
      email:      "receipts@goodybag.com"
    , password:   "G00dyb4agR3c31pt5!"
    }
  }

, filepicker: {
    key: 'AF52P8LtHSd6VMD07XdOQz'
  }

, defaultLogo: 'https://www.filepicker.io/api/file/jLhugLRSQAJVdUe88acg'
, defaultMonoLogo: 'https://www.filepicker.io/api/file/mbhVfKiSRO0W7SMV7Ygv'

, enums: ['tags', 'meal_types', 'meal_styles', 'cuisines']
};

config.dev = {
  env: 'dev'

, isDev: true

, deniedRecipients: [ local.testEmail || 'test@goodybag.com' ]
, deliveryServiceOrderAboveThresholdRecipients: [ local.testEmail || 'test@goodybag.com' ]
, restaurantContactRecipients: [ local.testEmail || 'test@goodybag.com' ]

, http: {
    port: 3000
  , timeout: 8000
  }

, rollbar: {
    accessToken: 'c7f82820e02c4bd7a759015518948ce3'
  }

, segmentIo: {
    secret: 'q3r0t2euni'
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

, testEmail: local.testEmail || 'test@goodybag.com'

, testPhoneSms: local.testPhoneSms || '1234567890'

, testPhoneVoice: local.testPhoneVoice || '1234567890'

, emailEnabled: true

, paymentSummaries: _.extend( {}, config.defaults.paymentSummaries,
    { bucket: 'pms-dev.goodybag.com' }
  )

, receipt: _.extend( {}, config.defaults.receipt,
    { bucket: 'dev-receipts.goodybag.com' }
  )

};

config.staging = {
  env: 'staging'

, numWorkers: +process.env['WEB_CONCURRENCY']

, isStaging: true

, cdn: {
    baseUrl: 'https://d1llefdsnne2yl.cloudfront.net'
  , bucket: 'cater-cdn-staging'
  }

, http: {
    port: process.env['PORT'] || 5000
  , timeout: 8000
  }

, rollbar: {
    accessToken: '8d240c636751439791b214c9ec8cf8af'
  }

, segmentIo: {
    secret: 'q3r0t2euni' // TODO: same as dev for now, replace later?
  }

, balanced: {
    secret: "ak-test-PuuQnMAqL7pNQ0t9xuMDV3upU2Pz5sLn"
  , marketplaceUri: "/v1/marketplaces/TEST-MP3gr1uHmPi0i42cNhdL4rEs"
  }

, ironMQ: {
    token: 'M-NmfDgtD66MCHYKTVS3m15BbSA'
  , projectId: '526990bcf2d1570009000035'
  }

, baseUrl: 'https://staging.goodybag.com'

, postgresConnStr: process.env['DATABASE_URL']

, requestLogger: {
    connStr: process.env['HEROKU_POSTGRESQL_SILVER_URL']
  , table: 'requests'
  , plan: 'month'
  }

, emailEnabled: true

, paymentSummaries: _.extend( {}, config.defaults.paymentSummaries,
    { bucket: 'pms-staging.goodybag.com' }
  )

, receipt: _.extend( {}, config.defaults.receipt,
    { bucket: 'staging-receipts.goodybag.com' }
  )

};

config.production = {
  env: 'production'
, numWorkers: +process.env['WEB_CONCURRENCY']

, isProduction: true

, restaurantRequestRecipients: [
    'jag@goodybag.com'
  , 'alexlauzon@goodybag.com'
  ]

, notableUserIds: [ 1944 ] // Send various notifications to Om based on user actions
, notableUserWarningRecipient: [ 'om@goodybag.com', 'preston@goodybag.com' ]

, cdn: {
    baseUrl: 'https://d3bqck8kwfkhx5.cloudfront.net'
  , bucket: 'cater-cdn-prod'
  }

, http: {
    port: process.env['PORT'] || 5000
  , timeout: 8000
  }

, rollbar: {
    accessToken: 'b85e21df4a1746b49d471441dfd70fa0'
  }

, segmentIo: {
    secret: 'k9ju1kq8vc'
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
  , tech: [
      'john@goodybag.com'
    , 'preston@goodybag.com'
    , 'om@goodybag.com' // temp for failed cc payments
    ]
  , orders: 'orders@goodybag.com'
  , waitlist: 'waitlist@goodybag.com'
  , onDeny: ['orders@goodybag.com', 'jag@goodybag.com']
  , welcome: 'jacobparker@goodybag.com'
  , info: 'info@goodybag.com'
  , rewards: [
      'jacobparker@goodybag.com'
    , 'jag@goodybag.com'
    , 'om@goodybag.com'
    , 'redemptions@goodybag.com'
    ]
  , dsOrders: [
      'christymedlock@goodybag.com'
    , 'patrickmugavin@goodybag.com'

    // temp
    , 'jacobparker@goodybag.com'
    , 'jag@goodybag.com'
    , 'om@goodybag.com'
    , 'alexlauzon@goodybag.com'
    ]
  , reminderIgnored: [
      'om@goodybag.com'
    // , 'jay@goodybag.com'
    , 'jag@goodybag.com'
    , 'jacobparker@goodybag.com'
    , 'christymedlock@goodybag.com'
    , 'patrickmugavin@goodybag.com'
    ]
  , orderNotificationChecks: [
      'christymedlock@goodybag.com'
    , 'patrickmugavin@goodybag.com'
    , 'john@goodybag.com'
    ]
  , reminderPaymentStatusIgnore: [
      'christymedlock@goodybag.com'
    , 'patrickmugavin@goodybag.com'
    ]
  }

, deliveryServices: {
    responseThresholdMins: 30
  , supportPhones: [
      '2105779226' // Christy Medlock
    , '3153457641' // Patrick Mugavin
    ]
  }

, emailEnabled: true

};

config.india = {
  env: 'india'
, baseUrl: 'https://india.goodybag.com'
, isIndia: true
, cdn: config.production.cdn
, postgresConnStr: process.env['DATABASE_URL']
};

// fields to copy from staging to india
[
  'http', 'ironMQ', 'balanced', 'rollbar'
, 'mandrill', 'segmentIo', 'intercom'
].forEach( function( key ){
  config.india[ key ] = config.staging[ key ];
});

config.india.logging = _.cloneDeep(config.defaults.logging); // logging self manages env

config.india.logging.mongoConnStr = false;
config.india.logging.transports.mongo = false;

config.test = _.extend( _.clone( config.dev ), {
  env: 'test'
, baseUrl: 'http://localhost:3001'
, http: { port: 3001, timeout: 8000 }
, postgresConnStr:  "postgres://localhost:5432/cater_test"
, cdn: { baseUrl: 'http://localhost:3001' }
, ordrin: {
    apiKeyPublic: '31XhIpj5gektUGCVR1XCNY1i4Rw-if5cN4IzvP1ncig'
  , apiKeyPrivate: 'JSRbZdQTBWtpDxIxXtO2aPmKc26M98V2NHjG7h09-iQ'
  , emailFormat: 'ordrin-user{salt}+{id}@goodybag.com'.replace( '{salt}', local.ordrinEmailSalt || '' )
  }
});

config.travis = _.extend( _.clone( config.dev ), {
  env: 'travis'
});

var GB_ENV = process.env['GB_ENV'] = process.env['GB_ENV'] || 'dev';
if (GB_ENV == null || !config.hasOwnProperty(GB_ENV)) GB_ENV = 'dev';

module.exports = _.defaults(config[GB_ENV], config.defaults);

module.exports.getEnv = function( env ){
  return _.defaults(config[env], config.defaults);
};

console.log('Loading ' + GB_ENV + ' config');
