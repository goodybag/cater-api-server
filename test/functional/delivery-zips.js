/**
 * Functional Test: Delivery-zips
 *
 * This is the description of this test
 */

process.env['GB_ENV'] = 'test';

var assert    = require('assert');
var test      = require('selenium-webdriver/testing');
var webdriver = require('selenium-webdriver');
var config    = require('../../config');
var utils     = require('../../utils');
var tutils    = require('../../lib/test-utils');

require('../../lib/selenium-utils');

test.describe( 'Delivery Zips Interface', function(){
  it( 'Display delivery zips by group if no order.zip has been set', function( done ){
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

    driver.get( config.baseUrl );

    utils.async.series([
      tutils.login.bind( null, driver, options )

      // View restaurant
    , function( next ){
        console.log('');
        test.log('View Restaurant');

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

      // Click the info tab
    , function( next ){
        test.log('Click the info tab')

        driver.ensureSelector( '.menu-info-tabs li:first-child + li > a', function( error, info ){
          assert.equal( !!error, false, 'Could not find info tab' );
          assert.equal( !!info, true, 'Could not find info tab' );
          info.click();

          driver.waitUntilSelector( '#info.active', next );
        });
      }

      // Make sure the delivery zips broken up by tiers
      // All test restaurants should have the same
    , function( next ){
        test.log('Make sure the delivery zips broken up by tiers')

        driver.find('.delivery-zip-tier-title + .list-delivery-zips', function( error, els ){
          assert.equal( els.length, 3, 'Did not get the expected number of zip groups' );
          next();
        });
      }
    ], done );
  });
});