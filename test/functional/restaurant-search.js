/**
 * Functional Test: Restaurant Search
 *
 * Tests searching on restaurants by order params and filters
 */

process.env['GB_ENV'] = 'test';

var assert    = require('assert');
var test      = require('selenium-webdriver/testing');
var webdriver = require('selenium-webdriver');
var config    = require('config');
var utils     = require('../../utils');
var db        = require('../../db');
var tutils    = require('../../lib/test-utils');

require('../../lib/selenium-utils');

test.describe( 'Restaurant Search', function(){
  it( 'Search by zip', function( done ){
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
      tutils.login.bind( null, driver, options )

    , function( next ){ console.log(''); next(); }

    , function( next ){
        test.log('Get restaurant_delivery_zips')
        next();
      }

      // Find the zip where id = 1, then find other records
      // that match the same zip
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
    , function( zips, next ){
        test.log('Ensuring we\'re on the restaurants listing');

        driver.ensureSelector( '.page-restaurants', function( error, result ){
          assert.equal( !!error, false, 'Not on Restaurants page' );
          assert.equal( !!result, true, 'Not on Restaurants page' );
          next( null, zips );
        });
      }
    ], done );
  });
});