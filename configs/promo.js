
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
      'gbaustin15', 'gbatx50', 'gb25austin', 'gbmar2016'
    ]
  }
, debbie: {
    email: 'Debbiegarcia@goodybag.com'
  , promo_code: ['gbnash50', 'gbnash75', 'rbrefnash', 'nash$50', 'nash$25']
  }
, virginia: {
    email: 'virginiasims@goodybag.com'
  , promo_code: ['gbhou75']
  }
, ramone: {
    email: 'ramonejohnson@goodybag.com'
  , promo_code: ['gbsea75', 'gbsea15', 'gbrefsea', 'gbfreesea', 'seattlegb' ]
  }
, virginia: {
    email: 'virginiasims@goodybag.com'
  , promo_code: ['gbhou75', 'gbhou15', 'gbhou25', 'gbhou50', 'gbrefhou']
  }
, jay: {
    email: 'jay@goodybag.com'
  , promo_code: ['gbjay']
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
