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

casper.test.begin( 'Place order', 1, function( test ){
  var options = {

  };

  casper.start( config.baseUrl );

  // Login
  casper.then( function(){
    // Assert something
  });

  casper.run( test.done.bind( test ) );
});