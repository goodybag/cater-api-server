
try {
  local = require('../local-config.json');
} catch (error) {
	if (error) local = {};
}

var promo = {
  adam: {
    email: ''
  , promo_code: ''
  }
, jacob: {
    email: 'jacobparker@goodybag.com'
  , promo_code: 'Goodybag321'
  }
};

module.exports = ({
  production: promo
, staging: promo
, dev: {
    test: {
      email: local.testEmail || 'test@goodybag.com'
    , promo_code: 'worf'
    }
  }
})[ process.env['GB_ENV'] || 'dev' ];
