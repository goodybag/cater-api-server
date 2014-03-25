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
var config    = require('config');
var utils     = require('../../utils');
var futils    = require('../../lib/ftest-utils');

require('../../lib/selenium-utils');

var driver = new webdriver.Builder().withCapabilities(
  webdriver.Capabilities.chrome()
).build();

test.after( function(){
  driver.quit();
})

test.describe( 'Order Flow', function(){
  it( 'should login and place an order', function( done ){
    var options = {
      timeout: 100000
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
        driver.ensureSelector( '.page-home', function( error, result ){
          assert.equal( !!error, false );
          assert.equal( !!result, true );
          next();
        });
      }

      // Fill Login
    , function( next ){
        utils.async.parallel({
          fillEmail: function( next ){
            driver.findElement( webdriver.By.css('#login-email') ).then( function( el ){
              el.sendKeys( options.email ).then( next.argClamp(0) )
            });
          }
        , fillPassword: function( next ){
            driver.findElement( webdriver.By.css('#login-password') ).then( function( el ){
              el.sendKeys( options.password ).then( next.argClamp(0) )
            });
          }
        }, next );
      }

      // Submit login
    , function( next ){
        driver.findElement( webdriver.By.css('form[action*="/login"]') ).then( function( el ){
          el.submit().then( next.argClamp(0) );
        });
      }

    , // Ensure we're on the restaurants page
      function( next ){
        driver.ensureSelector( '.page-restaurants', function( error, result ){
          assert.equal( !!error, false, 'Not on Restaurants page' );
          assert.equal( !!result, true, 'Not on Restaurants page' );
          next();
        });
      }

      // Select restaurant
    , function( next ){
        var selector = '.list-group-restaurants > .list-group-item-restaurant:first-child';
        driver.findElement( webdriver.By.css( selector ) ).then( function( el ){
          el.click();

          driver.waitUntilSelector( '.page-menu', next );
        });
      }

      // Ensure we're on the menu page
    , function( next ){
        driver.ensureSelector( '.page-menu', function( error, result ){
          assert.equal( !!error, false, 'Not on menu page' );
          assert.equal( !!result, true, 'Not on menu page' );
          next();
        });
      }

      // Click on an item, create order
    , function( next ){
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
              driver.executeScript( function(){
                $('.picker__day--infocus:not(.picker__day--disabled)').last().click();
                $('.picker__list-item:not(.picker__list-item--disabled)').last().click();
                $('.order-params-bar [name="guests"]').val( options.guests );
              });

              driver.ensureSelector( '#order-params-modal', function( error, btn ){
                assert.equal( !!error, false, 'Could not find order params submit button' );
                assert.equal( !!btn, true, 'Could not find order params submit button' );

                btn.click();
                setTimeout( next, 2000 );
              });
            }
          }, next );
        });
      }
    ], function( error ){
      done();
    })
  });
});