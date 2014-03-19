var localConfig = require('../../local-config');

var config = {
  baseUrl: 'http://localhost:3000'
};

for ( var key in localConfig ){
  config[ key ] = localConfig[ key ];
}

casper.test.begin( 'Can login', 1, function( test ){
  var options = {
    formSelector: 'form[action*="/login"]'
  , email:        'john+1@goodybag.com'
  , passowrd:     'password'
  };

  if ( config.emailSalt ){
    options.email = options.email.split('@').join( config.emailSalt + '@' );
  }

  casper.start( config.baseUrl );

  // Ensure login form exists
  casper.then( function(){
    test.assertExists( options.formSelector );
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
    // test.assertExists('.page-restaurants');
    test.assertEval( function(){
      return __utils__findAll('.list-group-item-restaurant').length > 0;
    }, 'Should have some resrtaurants' );
  });

  casper.run( test.done.bind( test ) );
});