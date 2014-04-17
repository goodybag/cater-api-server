/**
 * Functional Test: Accept-order
 * 
 * This is the description of this test
 */

process.env['GB_ENV'] = 'test';

var assert    = require('assert');
var test      = require('selenium-webdriver/testing');
var webdriver = require('selenium-webdriver');
var config    = require('config');
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
        test.log('Create new order');
        tutils.createOrder({status: 'submitted'}
        , function(error, results) {
            order = results[0];
            next(error);
        });
      }

    , function addOrderItem(next) {
        test.log('Add order item');
        tutils.addOrderItem({order_id: order.id}, next);
      }

    , tutils.login.bind( null, driver, options )

    , function reviewOrder(next) {
        test.log('View review order page');
        var url = config.baseUrl + '/orders/' + order.id + '?review_token=' + order.review_token;
        driver.get( url );

        driver.isElementPresent( webdriver.By.css('.restaurant-review') ).then(function(present) {
          assert(present, 'Could not review order');
          next();
        });
      }

    , function acceptOrder(next) {
        test.log('Accept order');
        var selector = '.restaurant-review > .btn-accept';
        driver.findElement( webdriver.By.css( selector ) ).click().then(next);
      }

    , function orderAccepted(next) {
        test.log('Order was accepted!');;
        driver.sleep(2000);
        driver.isElementPresent( webdriver.By.css('.btn-accepted') ).then(function(present){
          assert(present, 'Order not accepted');
          next();
        });
      }

    ], done );
  });
});