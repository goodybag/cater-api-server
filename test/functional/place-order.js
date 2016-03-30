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

process.env['GB_ENV'] = 'test';

var assert    = require('assert');
var test      = require('selenium-webdriver/testing');
var webdriver = require('selenium-webdriver');
var config    = require('../../config');
var utils     = require('../../utils');
var tutils    = require('../../lib/test-utils');
var db        = require('../../db');

Object.defineProperty( Function.prototype, 'argClamp', {
  enumerable: false
, value: function( n ){
    var this_ = this;
    return function(){
      return this_.apply( this_, Array.prototype.slice.call( arguments, 0, n ) );
    }
  }
});

require('../../lib/selenium-utils');

test.describe( 'Order Flow', function(){
  it( 'should login and place an order', function( done ){
    var driver = new webdriver.Builder().withCapabilities(
      webdriver.Capabilities.chrome()
    ).build();

    driver.manage().window().setSize( 1200, 1000 )

    test.before( function( done ){
      // Just delete all orders
      utils.async.series([
        db.order_statuses.remove.bind( db.order_statuses, {} )
      , db.orders.remove.bind( db.orders, {} )
      ], done );
    });

    test.after( function(){
      driver.quit();
    });

    var options = {
      timeout:      100000
    , email:        config.testEmail
    , password:     'password'
    , restaurantId: 1
    , zip:          78745
    , time:         '12:00 PM'
    , guests:       15
    , quantity:     1000
    };

    this.timeout( options.timeout );

    driver.get( config.baseUrl );

    utils.async.series([
      // Ensure we're on the home page
      function( next ){
        console.log('');
        test.log('Ensure we\'re on the home page')
        driver.ensureSelector( '.page-home', function( error, result ){
          assert.equal( !!error, false );
          assert.equal( !!result, true );
          next();
        });
      }

      // Fill Login
    , tutils.login.bind( null, driver, options )

    , // Ensure we're on the restaurants page
      function( next ){
        test.log('Ensure we\'re on the restaurants page')
        driver.ensureSelector( '.page-restaurants', function( error, result ){
          assert.equal( !!error, false, 'Not on Restaurants page' );
          assert.equal( !!result, true, 'Not on Restaurants page' );
          next();
        });
      }

      // Select restaurant
    , function( next ){
        test.log('Select restaurant')
        var selector = '.list-group-restaurants > .list-group-item-restaurant:first-child';
        driver.findElement( webdriver.By.css( selector ) ).then( function( el ){
          el.click();

          driver.waitUntilSelector( '.page-menu', next );
        });
      }

      // Ensure we're on the menu page
    , function( next ){
        test.log('Ensure were on the menu page')
        driver.ensureSelector( '.page-menu', function( error, result ){
          assert.equal( !!error, false, 'Not on menu page' );
          assert.equal( !!result, true, 'Not on menu page' );
          next();
        });
      }

      // Click on an item, create order
    , function( next ){
        test.log('Click on an item, create order')
        driver.ensureSelector( '.menu-category a.item:first-child', function( error, el ){
          assert.equal( !!error, false, 'Could not find any items' );
          assert.equal( !!el, true, 'Could not find any items' );

          el.click();

          driver.waitUntilSelector( '.modal-item.in', function( error, itemModal ){
            assert.equal( !!error, false, 'Modal did not come in' );
            assert.equal( !!itemModal, true, 'Modal did not come in' );

            driver.ensureSelector( '.item-quantity', function( error, el ){
              assert.equal( !!error, false, 'Item quantity input not found' );
              assert.equal( !!el, true, 'Item quantity input not found' );

              el.sendKeys( options.quantity );

              driver.ensureSelector( '.modal-item-form button[type="submit"]', function( error, btn ){
                assert.equal( !!error, false, 'Item submit button not found' );
                assert.equal( !!btn, true, 'Item submit button not found' );

                btn.click();
                next();
              });
            });
          });
        });
      }

      // Order params
    , function( next ){
        test.log('Order params')
        driver.waitUntilSelector( '.modal-order-params.in', function( error, paramsModal ){
          assert.equal( !!error, false, 'Order params modal did not open' );
          assert.equal( !!paramsModal, true, 'Order params modal did not open' );

          utils.async.parallel({
            zip: function( next ){
              // Second child in case the first one is the "Default address"
              driver.ensureSelector( '#zips > option:first-child + option', function( error, zipOption ){
                assert.equal( !!error, false, 'Could not find zips list option' );
                assert.equal( !!zipOption, true, 'Could not find zips list option' );

                driver.ensureSelector( '.order-params-bar [name="zip"]', function( error, zip ){
                  assert.equal( !!error, false, 'Could not find order params zip input' );
                  assert.equal( !!zip, true, 'Could not find order params zip input' );

                  zip.sendKeys( zipOption.getAttribute('value') );

                  next();
                });
              });
            }

          , theRest: function( next ){
              driver.executeScript( function( guests ){
                $('.picker__day--infocus:not(.picker__day--disabled)').last().click();
                $('.picker__list-item:not(.picker__list-item--disabled)').last().click();
                $('.order-params-bar [name="guests"]').val( guests );
              }, options.guests );

              driver.ensureSelector( '#order-params-modal button[type="submit"]', function( error, btn ){
                assert.equal( !!error, false, 'Could not find order params submit button' );
                assert.equal( !!btn, true, 'Could not find order params submit button' );

                btn.click();

                next();
              });
            }
          }, next );
        });
      }

      // Wait until modals close
    , function( next ){
        test.log('Wait until modals close')
        driver.waitUntilSelector( '.modal-item:not(.in)', function( error ){
          assert.equal( !!error, false, 'Item modal did not close after submitting order params' );
          next();
        });
      }

      // Ensure item got added
    , function( next ){
        test.log('Ensure item got added')
        driver.waitUntilSelector( '.order-table tbody tr', function( error ){
          assert.equal( !!error, false, 'Item never showed up in order table' );
          next();
        });
      }

      // Checkout
    , function( next ){
        test.log('Checkout')
        // Hide shit in the way of our button
        driver.executeScript( function(){
          $('#habla_beta_container_do_not_rely_on_div_classes_or_names').remove();
          $('#intercom').remove();
        });

        driver.waitUntilSelector( '.order-summary .panel-footer:not(.hide) .btn-checkout', function( error, btn ){
          assert.equal( !!error, false, 'Did not meet order minimum!' );
          assert.equal( !!btn, true, 'Did not meet order minimum!' );

          // Not sure why this is necessary, but I guess the order summary
          // is getting re-rendered multiple times or something
          setTimeout( function(){ btn.click(); next(); }, 1000 );
        });
      }

      // Ensure we're on order page
    , function( next ){
        test.log('Ensure were on order page')
        driver.waitUntilSelector( '.page-order', function( error ){
          assert.equal( !!error, false, 'Never got to order page' );

          driver.ensureSelector( '.btn-submit', function( error, btn ){
            assert.equal( !!error, false, 'Could not find submit button' );
            assert.equal( !!btn, true, 'Could not find submit button' );
            btn.click();
            next();
          });
        });
      }

      // Ensure we're on checkout
    , function( next ){
        test.log('Ensure were on checkout')
        driver.waitUntilSelector( '.page-checkout', function( error ){
          assert.equal( !!error, false, 'Never got to checkout page' );

          next();
        });
      }

      // Fill in order name and tip
    , function( next ){
        test.log('Fill in order name and tip')
        driver.executeScript( function(){
          $('#order-name').val('Test Order');
        });

        driver.ensureSelector( '#order-tip > option[value="10"]', function( error, option ){
          assert.equal( !!error, false, 'Could not find 10% tip option' );

          option.click();

          next();
        });
      }

      // Fill in delivery info
    , function( next ){
        test.log('Fill in delivery info')
        driver.executeScript( function(){
          // Remove intercome to clear click handler
          $('#intercom').remove();
          $('.delivery-info #name').val('Test Location');
          $('.delivery-info #street').val('123 Sesame St');
          $('.delivery-info #city').val('Austin');
          $('.delivery-info #phone').val('1234567890');
        });

        driver.ensureSelector( '.panel-actions button[type="submit"]', function( error, btn ){
          assert.equal( !!error, false, 'Could not find submit button' );

          btn.click();

          next();
        });
      }

      // Ensure we're on the receipt page
    , function( next ){
        test.log('Ensure were on the receipt page')
        driver.waitUntilSelector( '.page-order', function( error, result ){
          assert.equal( !!error, false, 'Not on receipt page' );
          assert.equal( !!result, true, 'Not on receipt page' );
          next();
        });
      }
    ], done );
  });
});