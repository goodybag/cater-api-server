var env = process.env.GB_ENV;

if ( ['dev', 'production'].indexOf( env ) === -1 ){
  env = 'dev';
}
var stripe = {
  dev: {
    secret: 'sk_test_XksbwDuLK1xbpOFaSVLVf9qZ'
  , public: 'pk_test_9N1srz1fVmWGyRAAhmzAA7aP'
  }

, production: {
    secret: 'sk_live_kjAFUHK2tYc6BRHRyeMlZPON'
  , public: 'pk_live_kShOkv0NSx9Lj1qWGqxAXotN'
  }
}

module.exports = stripe[env];
