var env = process.env.GB_ENV;

if ( ['dev', 'production'].indexOf( env ) === -1 ){
  env = 'dev';
}
var stripe = {
  dev: {
    secret: 'sk_test_XksbwDuLK1xbpOFaSVLVf9qZ'
  }

, production: {
    secret: 'sk_live_kjAFUHK2tYc6BRHRyeMlZPON'
  }
}

module.exports = stripe[env];
