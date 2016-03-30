/**
 * Functional Test: Restaurant Search
 *
 * Tests searching on restaurants by order params and filters
 */

process.env['GB_ENV'] = 'test';

var assert    = require('assert');
var test      = require('selenium-webdriver/testing');
var webdriver = require('selenium-webdriver');
var config    = require('../../config');
var utils     = require('../../utils');
var db        = require('../../db');
var tutils    = require('../../lib/test-utils');

require('../../lib/selenium-utils');

test.describe( 'Restaurant Search', function(){
  it( 'Filters by zip', function( done ){
    var options = {
      timeout:      100000
    , email:        config.testEmail
    , password:     'password'
    , win: {
        width:      1200
      , height:     1000
      }
    };

    this.timeout( options.timeout );

    var driver = new webdriver.Builder().withCapabilities(
      webdriver.Capabilities.chrome()
    ).build();

    driver.manage().window().setSize( options.win.width, options.win.height );

    test.after( function(){
      driver.quit();
    });

    // Test Body
    driver.get( config.baseUrl );

    utils.async.waterfall([
      function( next ){ console.log(''); next(); }

    , test.alog('Login')
    , tutils.login.bind( null, driver, options )

      // Find the zip where id = 1, then find other records
      // that match the same zip
    , test.alog('Get restaurant_delivery_zips')
    , db.restaurant_delivery_zips.find.bind(
        db.restaurant_delivery_zips
      , { zip: '$initial.zip$' }
      , {
          with: {
            initial: {
              type: 'select'
            , table: 'restaurant_delivery_zips'
            , where: { id: 1 }
            }
          }
        , table: ['restaurant_delivery_zips', 'initial']
        }
      )

    , function( zips, next ){
        assert.equal( zips.length > 0, true, 'Did not find any delivery zips!' );
        next( null, zips );
      }

      // View restaurants
    , test.alog('Ensure we\'re on the restaurants listing')
    , function( zips, next ){
        driver.ensureSelector( '.page-restaurants', function( error, result ){
          assert.equal( !!error, false, 'Not on Restaurants page' );
          assert.equal( !!result, true, 'Not on Restaurants page' );
          next( null, zips );
        });
      }

      // Search for zip
    , function( zips, next ){
        test.log( 'Sending: ' + zips[0].zip );

        driver.ensureSelector( '.order-params-bar [name="zip"]', function( error, el ){
          assert.equal( !!error, false, 'Could not find zip field' );
          assert.equal( !!el, true, 'Could not find zip field' );

          el.sendKeys( zips[0].zip + '\n' );

          next( null, zips );
        });
      }

      // Check number of listings
    , test.alog('Ensure number of restaurants')
    , function( zips, next ){
        driver.waitUntilSelector( '.search-info', function( error, el ){
          assert.equal( !!error, false, 'Page did not reload' );

          driver.find( '.list-group-restaurants > a.list-group-item', function( error, els ){
            assert.equal( !!error, false, 'Did not find any restaurant elements' );
            assert.equal( els.length, zips.length, 'Number of restaurants did not match zips' );

            next();
          });
        });
      }
    ], done );
  });

  it( 'Filters by price', function( done ){
    var options = {
      timeout:      100000
    , email:        config.testEmail
    , password:     'password'
    , win: {
        width:      1200
      , height:     1000
      }
    };

    this.timeout( options.timeout );

    var driver = new webdriver.Builder().withCapabilities(
      webdriver.Capabilities.chrome()
    ).build();

    driver.manage().window().setSize( options.win.width, options.win.height );

    test.after( function(){
      driver.quit();
    });

    // Test Body
    driver.get( config.baseUrl );

    utils.async.waterfall([
      function( next ){ console.log(''); next(); }

    , test.alog('Login')
    , tutils.login.bind( null, driver, options )

    , test.alog('Wait until counts have been figured out')
    , function( next ){
        var check = function( callback ){
          driver.executeAsyncScript( function( callback ){
            // Remove everything except the count
            var num = $('#panelPrice .checkbox:first-child').text().replace(/\s|\$|\(|\)/g, '');
            return callback( parseInt( num ) );
          }).then( callback, callback );
        };

        driver.waitUntil( check, function( error, result ){
          assert.equal( !!error, false, 'Error getting first dollar amount restaurant count' );
          assert.equal( result > 0, true, 'First dollar amount restaurant count was 0' );

          next( null, result );
        });
      }

    , test.alog('Open accordion and click on checkbox')
    , function( count, next ){
        driver.ensureSelector( '[data-target="#panelPrice"]', function( error, panel ){
          assert.equal( !!error, false, 'Could not get Accordion panel' );

          panel.click();

          driver.waitUntilSelector( '[data-target="#panelPrice"]:not(.collapsed)', function( error ){
            assert.equal( !!error, false, 'Could not get un-collapsed Accordion panel' );

            driver.ensureSelector( '#panelPrice .checkbox:first-child input', function( error, el ){
              assert.equal( !!error, false, 'Could not get first price checkbox' );

              setTimeout( function(){
                el.click();
                next( null, count );
              }, 500 );
            });
          });
        });
      }

    , test.alog('Ensure counts match up')
    , function( count, next ){
        driver.waitUntilSelector( '.search-info', function( error, el ){
          assert.equal( !!error, false, 'Page did not reload' );

          driver.find( '.list-group-restaurants > a.list-group-item', function( error, els ){
            assert.equal( !!error, false, 'Did not find any restaurant elements' );
            assert.equal( els.length, count, 'Number of restaurants did not match filter count' );

            next();
          });
        });
      }

    , test.alog('Filter again')
    , function( next ){
        var check = function( callback ){
          driver.executeAsyncScript( function( callback ){
            // Remove everything except the count
            var num = $('#panelPrice .checkbox:first-child + .checkbox').text().replace(/\s|\$|\(|\)/g, '');
            return callback( parseInt( num ) );
          }).then( callback, next );
        };

        driver.waitUntil( check, function( error, result ){
          assert.equal( !!error, false, 'Error getting second dollar amount restaurant count' );
          assert.equal( result > 0, true, 'Second dollar amount restaurant count was 0' );

          driver.ensureSelector( '#panelPrice .checkbox:first-child + .checkbox input', function( error, el ){
            assert.equal( !!error, false, 'Could not get first price checkbox' );

            el.click();
            next( null, result );
          });
        });
      }

    , test.alog('Ensure counts are right')
    , function( count, next ){
        driver.waitUntilSelector( '.search-info', function( error, el ){
          assert.equal( !!error, false, 'Page did not reload' );

          driver.find( '.list-group-restaurants > a.list-group-item', function( error, els ){
            assert.equal( !!error, false, 'Did not find any restaurant elements' );
            assert.equal( els.length, count, 'Number of restaurants did not match filter count' );

            next();
          });
        });
      }
    ], done );
  });
});