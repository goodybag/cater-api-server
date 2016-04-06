/**
 * Functional Test: Accept-order
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
var db        = require('../../db');

require('../../lib/selenium-utils');

test.describe( 'Accept Order', function(){
  it( 'should place order', function( done ){
    var options = {
      timeout:      100000
    , email:        config.testEmail
    , password:     'password'
    , win: {
        width:      1600
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

    var order;

    utils.async.series([
      function createOrder(next) {
        console.log('');
        tutils.createOrder({status: 'submitted'}
        , function(error, results) {
            order = results[0];
            next(error);
        });
      }
    , test.alog('Created new order')

    , function addOrderItem(next) {
        tutils.addOrderItem({order_id: order.id}, next);
      }

    , test.alog('Added order item')

    , tutils.login.bind( null, driver, options )
    
    , test.alog('Logged in')
    
    , function reviewOrder(next) {
        var url = config.baseUrl + '/orders/' + order.id + '?review_token=' + order.review_token;
        driver.get( url );
        driver.waitUntilSelector( '.restaurant-review', function(error, el) {
          assert.equal( !!error, false, 'Could not review order');
          assert.equal( !!el, true, 'Could not review order');
          next();
        });
      }

    , test.alog('Viewing review order page')

    , function acceptOrder(next) {
        var selector = '.restaurant-review > .btn-accept';
        driver.findElement( webdriver.By.css( selector ) ).click().then(next);
      }

    , test.alog('Accepting order')

    , function orderAccepted(next) {
        driver.waitUntilSelector('.btn-accepted', function(error, btn) {
          assert.equal( !!error, false, 'Order not accepted');
          assert.equal( !!btn, true, 'Order not accepted');
          next();
        });
      }

    , test.alog('Order was accepted!')

    ], done );
  });
});