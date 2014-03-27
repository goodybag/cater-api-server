/**
 * Functional Test: Delivery-zips
 *
 * This is the description of this test
 */

process.env['GB_ENV'] = 'test';

var assert    = require('assert');
var test      = require('selenium-webdriver/testing');
var webdriver = require('selenium-webdriver');
var config    = require('config');
var utils     = require('../../utils');

require('../../lib/selenium-utils');

var driver = new webdriver.Builder().withCapabilities(
  webdriver.Capabilities.chrome()
).build();

driver.manage().window().setSize( 1200, 1000 )

test.after( function(){
  driver.quit();
});

test.describe( 'Delivery Zips Interface', function(){
  it( 'Display  delivery zips by group', function( done ){
    // Test Body
    driver.get( config.baseUrl );
  });
});