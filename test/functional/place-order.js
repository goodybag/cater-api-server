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

casper.test.begin( 'Place order', 1, function( test ){
  var options = {
    userId:     1
  , password:   'password'
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

  casper.run( test.done.bind( test ) );
});