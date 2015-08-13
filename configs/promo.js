
try {
  local = require('../local-config.json');
} catch (error) {
	if (error) local = {};
}

var promo = {
  adam: {
    email: 'adam.peacock@goodybag.com'
  , promo_code: ['g315b', 'gbsea15', 'gb315', 'gb518']
  }
, jacob: {
    email: 'jacobparker@goodybag.com'
  , promo_code: ['goodybag315', 'gb415', 'gbaustin15', 'gbhou15', 'gbstar15', 'gbamaz15', 'gbfree0715', 'gbgift0815']
  }
, christy: {
    email: 'christymedlock@goodybag.com'
  , promo_code: ['gbfree0715']
  }
, toby: {
    email: 'tobyshields@goodybag.com'
  , promo_code: ['seattlegb', 'seagoody']
  }
, om: {
    email: 'om@goodybag.com'
  , promo_code: [ 'bv250' ]
  }
, starkebab: {
    email: [
      'om@goodybag.com'
    , 'patrickmugavin@goodybag.com'
    , 'tobyshields@goodybag.com'
    , 'christymedlock@goodybag.com'
    ]
  , promo_code: [ 'starkebab' ]
  }
, dropoff: {
    email: [
        'jacobparker@goodybag.com'
      , 'patrickmugavin@goodybag.com'
      , 'christymedlock@goodybag.com'
    ]
  , promo_code: [
      'dropoff1', 'dropoff2', 'dropoff3'
    , 'dropoff4', 'dropoff5', 'dropoff6'
    , 'dropoff7', 'dropoff8', 'dropoff9'
    ]
  }
};

module.exports = ({
  production: promo
, staging: promo
, dev: {
    test: {
      email: local.testEmail || 'test@goodybag.com'
    , promo_code: ['worf']
    }
  }
})[ process.env['GB_ENV'] || 'dev' ];
