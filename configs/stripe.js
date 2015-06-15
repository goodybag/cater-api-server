var env = process.env.GB_ENV;

if ( ['dev', 'production'].indexOf( env ) === -1 ){
  env = 'dev';
}
var stripe = {
  dev: {
    secret: 'sk_test_XksbwDuLK1xbpOFaSVLVf9qZ'
  , public: 'pk_test_9N1srz1fVmWGyRAAhmzAA7aP'
  , invoicing: {
      // Note this user is charged in place of invoiced orders
      customer_id:  'cus_6JlgrqVG6kjp18'
    , card_id:      'card_1678BrEQiCMC2eZ7TaSpmEGJ'
    }
  , tos_url: 'https://stripe.com/connect/account-terms'
  }

, staging: {
    secret: 'sk_test_XksbwDuLK1xbpOFaSVLVf9qZ'
  , public: 'pk_test_9N1srz1fVmWGyRAAhmzAA7aP'
  , invoicing: {
      customer_id:  'cus_6JlgrqVG6kjp18'
    , card_id:      'card_1678BrEQiCMC2eZ7TaSpmEGJ'
    }
  , tos_url: 'https://stripe.com/connect/account-terms'
  }

, production: {
    secret: 'sk_live_kjAFUHK2tYc6BRHRyeMlZPON'
  , public: 'pk_live_kShOkv0NSx9Lj1qWGqxAXotN'
  , invoicing: {
      customer_id:  'cus_6JlC2GULQFI86R'
    , card_id:      'card_1677pbEQiCMC2eZ7c3BDAdUv'
    }
  }
  , tos_url: 'https://stripe.com/connect/account-terms'
}

module.exports = stripe[env];
