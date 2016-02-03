
try {
  local = require('../local-config.json');
} catch (error) {
	if (error) local = {};
}

var promo = {
  adam: {
    email: 'adam.peacock@goodybag.com'
  , promo_code: ['g315b', 'gbsea15', 'gb315', 'gb518', 'gbhou0818', 'gbhou15']
  }
, jacob: {
    email: 'jacobparker@goodybag.com'
  , promo_code: [
      'gbaustin15', 'gbatx75', 'gbausfree'
    ]
  }
, debbie: {
    email: 'Debbiegarcia@goodybag.com'
  , promo_code: ['gbnash75', 'rbrefnash']
  }
, virginia: {
    email: 'virginiasims@goodybag.com'
  , promo_code: ['gbhou75']
  }
, ramone: {
    email: 'ramonejohnson@goodybag.com'
  , promo_code: ['gbseafree', 'gbsea75', 'gbsea15', 'gbrefsea', 'gbfreesea', 'seattlegb' ]
  }
, virginia: {
    email: 'virginiasims@goodybag.com'
  , promo_code: ['gbhou75', 'gbhou15', 'gbhou25', 'gbhou50', 'gbrefhou']
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
