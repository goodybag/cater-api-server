var config = require('../../functional-config');

var makeTest = function( options ){
  options = options || {};

  if ( !options.preLoginSelector ){
    throw new Error('options.preLoginSelector required');
  }

  var defaults = {
    formSelector:         'form[action*="/login"]'
  , postLoginSelector:    '.page-restaurants'
  , email:                'john+1@goodybag.com'
  , password:             'password'
  , url:                  config.baseUrl
  };

  for ( var key in defaults ){
    if ( !(key in options) ) options[ key ] = defaults[ key ];
  }

  return function( test ){
    if ( config.emailSalt ){
      options.email = options.email.split('@').join( config.emailSalt + '@' );
    }

    casper.start( options.url );

    // Ensure login form exists
    casper.then( function(){
      test.assertExists( options.formSelector );
      test.assertExists( options.preLoginSelector );
    });

    // Attempt to login
    casper.then( function(){
      var login = {
        email:    options.email
      , password: options.password
      };

      this.fill( options.formSelector, login, true );
    });

    // Page should go to /restaurants
    casper.then( function(){
      test.assertExists( options.postLoginSelector );
    });

    casper.run( test.done.bind( test ) );
  };
};

casper.test.begin( 'Can login via splash page', 3, makeTest({
  preLoginSelector: '.page-home'
}));

casper.test.begin( 'Can login via login page', 3, makeTest({
  preLoginSelector: '.page-login'
, url: [ config.baseUrl, 'login' ].join('/')
}));