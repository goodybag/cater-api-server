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

casper.test.begin( 'Place order', 2, function( test ){
  var options = {
    userId:       1
  , password:     'password'
  , restaurantId: 25
  };

  options.email = futils.getEmail( options.userId );

  casper.start( config.baseUrl );

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

  casper.run( test.done.bind( test ) );
});