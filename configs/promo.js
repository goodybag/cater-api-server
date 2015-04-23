
try {
  local = require('../local-config.json');
} catch (error) {
	if (error) local = {};
}

var promo = {
  adam: {
    email: 'adam.peacock@goodybag.com'
  , promo_code: ['G315B', 'GBSEA15', 'GB315']
  }
, jacob: {
    email: 'jacobparker@goodybag.com'
  , promo_code: ['Goodybag315', 'GB415', 'GBAUSTIN15', 'GBHOU15']
  }
, om: {
    email: 'om@goodybag.com'
  , promo_code: [ 'APRILSHOWERS', 'MAYFLOWERS' ]
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
