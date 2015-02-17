/**
 * Config.Intercom
 */

var _ = require('lodash');

module.exports = {
  enabled: false
};

var config = {
  dev: {
    apiSecret: 'A4NvND_qEf-ksKYhVw-GduUS2ruW2NlC39murXx2'
  , appId: 'qsetwlny'
  }

, staging: {
    apiSecret: 'tumIlUFE__wGfvVxtAyESXRMroQJAz5csfMKULAY'
  , appId: '6bxgiurw'
  }

, production: {
    apiSecret: '5I1eNUY_F6HKl_Gb15965fr5VgGfNlwny7WmyKZx'
  , appId: '13s9qu57'
  }
};

_.extend( module.exports, config[ process.env.GB_ENV || 'dev' ] );