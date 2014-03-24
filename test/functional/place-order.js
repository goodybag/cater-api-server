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

// Moment will not work in phantomjs so we use sugar
require('../../node_modules/sugar/release/sugar-full.development');

// casper.options.waitTimeout = 20000;

casper.test.begin( 'Place order', 8, function( test ){
  var options = {
    userId:       3
  , password:     'password'
  , restaurantId: 1
  , itemId:       1
  , zip:          78745
  , time:         '12:00 PM'
  , guests:       15
  , quantity:     1000
  };

  options.email = futils.getEmail( options.userId );

  // casper.start( [ config.baseUrl, 'restaurants', options.restaurantId ].join('/') );
  casper.start( config.baseUrl );

  futils.stdSetup( casper );

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

  // Ensure the modal opened
  casper.then( function(){
    this.waitUntilVisible( '.modal-item.in', function(){
      test.assertExists('.modal-item-form button[type="submit"]');
    });
  });

  // Submit form
  casper.thenClick('.modal-item-form button[type="submit"]');

  casper.then( function(){
    this.waitUntilVisible( '.modal-order-params.in', function(){
      test.assertExists('.order-params-bar');
    });
  });

  casper.then( function(){
    var data = { guests: options.guests };

    test.assertExists('.page-menu');
    data.zip = this.evaluate( function(){
      return +$('#zips > option').eq(0).val();
    });

    this.evaluate( function(){
      // Use last to ensure the date is far enough ahead
      $('.picker__day--infocus:not(.picker__day--disabled)').last().click();
      $('.picker__list-item:not(.picker__list-item--disabled)').last().click();
      $('.modal-item .item-quantity').val( options.quantity );
      return;
    });

    this.fill( '.order-params-bar form', data, false );

    test.assertExists('.modal-order-params button[type="submit"]');
  });

  casper.thenClick('.modal-order-params button[type="submit"]');

  casper.then( function(){
    this.waitUntilVisible( '.order-table #order-item-' + options.itemId, function(){
      test.assertExists('.page-menu');
      test.assertDoesntExist('.order-summary .minimum-order');
    });
  });

  casper.run( test.done.bind( test ) );
});