/**
 * Selenium Utils
 *
 * Extends the WebDriver prototype to include some nicer functions.
 */

var _         = require('lodash');
var webdriver = require('selenium-webdriver');

Object.defineProperty( Function.prototype, 'argClamp', {
  enumerable: false
, value: function( n ){
    var this_ = this;
    return function(){
      return this_.apply( this_, Array.prototype.slice.call( arguments, 0, n ) );
    }
  }
});

/**
 * Ensures a selector matches one or more elements in the DOM
 * @param  {String}   selector The CSS selector to test
 * @param  {Function} callback callback( error, result )
 */
webdriver.WebDriver.prototype.ensureSelector = function( selector, callback ){
  this.findElement( webdriver.By.css( selector ) ).then( function( el ){
    return callback( null, el );
  }, function( error ){
    return callback( error, false );
  });
};

/**
 * Waits until the check function passes. Assumes asynchrony
 * so return your result as the first argument to the callback
 * supplied to `check`
 *
 * Usage:
 *
 * // Wait until jquery is ready
 * driver.waitUntil( function( callback ){
 *   driver.executeAsyncScript( function( callback ){
 *    return callback( typeof window.$ === 'function' );
 *  }).then( callback );
 * }, function(){
 *   console.log('Complete!');
 * })
 *
 * Options: {
 *   tickInterval:  100   // How often to check
 * , timeout:       5000  // How long until an error is thrown
 * }
 *
 * @param  {Function} check    Truthiness test
 * @param  {Object}   options  Options object
 * @param  {Function} callback callback( error, result ) when complete
 */
webdriver.WebDriver.prototype.waitUntil = function( check, options, callback, curr ){
  var this_ = this;

  if ( typeof options === 'function' ){
    callback = options;
    options = {};
  }

  options = _.defaults( options, {
    tickInterval: 100
  , timeout:      5000
  });

  if ( curr >= options.timeout ){
    throw new Error('Check has timed out');
  }

  check( function( result ){
    if ( !result ){
      return setTimeout(
        this_.waitUntil.bind( this_, check, options, callback, curr + options.tickInterval )
      , options.tickInterval
      );
    }

    return callback( null, result );
  });
};

/**
 * Waits until the selector is found. Returns with the element
 * @param  {String}   selector CSS Selector
 * @param  {Object}   options  Options object (see waitUntil)
 * @param  {Function} callback callback( error, element )
 */
webdriver.WebDriver.prototype.waitUntilSelector = function( selector, options, callback ){
  var this_ = this;
  this.waitUntil(
    function( callback ){
      this_.executeAsyncScript( function( selector, callback ){
        return callback( typeof window.$ === 'function' ? window.$( selector )[0] : null );
      }, selector ).then( callback, callback );
    }
  , options
  , callback
  );
};