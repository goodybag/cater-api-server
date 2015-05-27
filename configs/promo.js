
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
  , promo_code: ['goodybag315', 'gb415', 'gbaustin15', 'gbhou15']
  }
, om: {
    email: 'om@goodybag.com'
  , promo_code: [ 'bv250' ]
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
