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
var selUtils  = require('../../lib/selenium-utils');

Function.prototype.argClamp = function( n ){
  var this_ = this;
  return function(){
    return this_.apply( this_, Array.prototype.slice.call( arguments, 0, n ) );
  }
};

test.describe( 'Order Flow', function(){
  it( 'should login and place an order', function( done ){
    var options = {
      timeout: 100000
    , userId:       3
    , password:     'password'
    , restaurantId: 1
    , itemId:       1
    , zip:          78745
    , time:         '12:00 PM'
    , guests:       15
    , quantity:     1000
    };

    this.timeout( options.timeout );

    options.email = futils.getEmail( options.userId );

    var driver = new webdriver.Builder().withCapabilities(
      webdriver.Capabilities.chrome()
    ).build();

    var sutils = selUtils.create( driver );

    driver.get( config.baseUrl );

    utils.async.series([
      // Ensure we're on the home page
      function( next ){
        sutils.ensureSelector( '.page-home', function( error, result ){
          assert.equal( !!error, false );
          assert.equal( result, true );
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
        sutils.ensureSelector( '.page-restaurants', function( error, result ){
          assert.equal( !!error, false );
          assert.equal( result, true );
          next();
        });
      }

      // Select restaurant
    , function( next ){
        var selector = '.list-group-restaurants > .list-group-item-restaurant:first-child';
        driver.findElement( webdriver.By.css( selector ) ).then( function( el ){
          el.click();

          sutils.waitUntil(
            function( callback ){
              driver.executeAsyncScript()
            }
          );

          driver.wait( next.argClamp(0), 2000 );
        });
      }

    , // Ensure we're on the menu page
      function( next ){
        sutils.ensureSelector( '.page-menu', function( error, result ){
          assert.equal( !!error, false );
          assert.equal( result, true );
          next();
        });
      }

    , function()
    ], function( error ){
      driver.quit();
      done();
    })
  });
});