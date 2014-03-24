/**
 * Functional Test: Place-order
 *
 * This should go through the flow of setting up an order:
 *   - Login
 *   - Select restaurant
 *   - Add item
 *   - Create order
 *   - Add more items
 *   - Review
 *   - Checkout
 */

var config = require('../../functional-config');
var futils = require('../../lib/ftest-utils');

// casper.options.waitTimeout = 20000;

casper.test.begin( 'Place order', 3, function( test ){
  var options = {
    userId:       1
  , password:     'password'
  , restaurantId: 25
  , itemId:       101
  };

  options.email = futils.getEmail( options.userId );

  // casper.start( [ config.baseUrl, 'restaurants', options.restaurantId ].join('/') );
  casper.start( config.baseUrl );

  casper.on( 'page.error', function( message, trace ){
    this.echo( 'remote error caught: ' + message, 'ERROR' );
    this.echo( trace, 'ERROR' );
  });

  // Login
  casper.then(
    futils.login( test, {
      email:      options.email
    , password:   options.password
    })
  );

  // Ensure we made it to restaurants
  casper.then( function(){
    test.assertExists('.page-restaurants');
  });

  // Select restaurant
  casper.then(
    futils.selectRestaurant( test, {
      restaurantId: options.restaurantId
    })
  );

  // Ensure we made it to menu
  casper.then( function(){
    test.assertExists('.page-menu');
  });

  casper.waitFor( function(){
    return casper.evaluate( futils.isReady() );
  });

  // Click a menu item
  casper.thenClick( [ '#item', options.itemId ].join('-') );

  casper.then( function(){
    this.capture('test.png');
  });

  // // Ensure the modal opened
  casper.then( function(){
    this.waitUntilVisible( '.in', function(){
      test.assertExists('.in');
    });
  });

  casper.run( test.done.bind( test ) );
});