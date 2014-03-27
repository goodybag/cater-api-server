/**
 * Test Utils
 */

var webdriver = require('selenium-webdriver');
var utils     = require('../utils');
var tutils    = module.exports = {};

tutils.login = function( driver, options, callback ){
  if ( !(driver instanceof webdriver.WebDriver) ){
    throw new Error('First argument needs to be valid WebDriver');
  }

  if ( !options.email ){
    throw new Error('Invalid email passed to options')
  }

  if ( !options.password ){
    throw new Error('Invalid password passed to options')
  }

  driver.findElement( webdriver.By.css('form[action*="/login"]') ).then( function( el ){
    webdriver.promise.all([
      el.findElement( webdriver.By.css('[name="email"]') )
    , el.findElement( webdriver.By.css('[name="password"]') )
    ]).then( function( els ){
      els[0].sendKeys( options.email );
      els[1].sendKeys( options.password );
      el.submit().then( function(){ if ( callback ) callback(); }, callback );
    }, callback );
  }, callback );
};