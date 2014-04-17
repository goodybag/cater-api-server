/**
 * Test Utils
 */

var webdriver = require('selenium-webdriver');
var test      = require('selenium-webdriver/testing');
var Base      = require('mocha/lib/reporters/base');
var utils     = require('../utils');
var tutils    = module.exports = {};
var db        = require('../db');

test.log = function( msg, indentation ){
  indentation = new Array( indentation || 3 ).join(' ');
  console.log( indentation + Base.color( 'pass', '  ◦ ' + msg ) );
};

tutils.login = function( driver, options, callback ){
  test.log('Logging in');
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

tutils.createOrder = function( values, callback ){
  if ( typeof values === 'function' ) {
    callback = values;
    values = {};
  }

  values = utils.extend({
    user_id: 3
  , restaurant_id: 1
  , review_token: 'abcdef'
  }, values);

  db.orders.insert(values, {
    returning: ['*']
  }, callback);
};

tutils.addOrderItem = function( values, callback ){
  if ( typeof values === 'function' ) {
    callback = values;
    values = {};
  }

  values = utils.extend({
    item_id: 1
  , order_id: 1
  , quantity: 12
  , name: 'Test item'
  , description: 'Test description'
  , price: 1234
  , feeds_min: 1
  , feeds_max: 3
  }, values);

  db.order_items.insert(values, {
    returning: ['*']
  }, callback);
};

test.alog = tutils.alog = function( msg ){
  return function(){
    test.log( msg );

    // Curry along any arguments to the next
    var args = [ null ].concat( Array.prototype.slice.call( arguments, 0, arguments.length - 1 ) );
    arguments[ arguments.length - 1 ].apply( this, args );
  };
};