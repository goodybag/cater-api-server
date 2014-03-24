/**
 * Selenium Utils
 */

var webdriver = require('selenium-webdriver');

module.exports.create = function( driver ){
  return Object.create({
    ensureSelector: function( selector, callback ){
      try {
        driver.findElement( webdriver.By.css( selector ) ).then( function(){
          return callback( null, true );
        });
      } catch ( e ){
        return callback( e, false );
      }
    }

  , waitUntil: function( check, callback ){
      check( function( result ){
        if ( !result ){
          return setTimeout( this.waitUntil.bind( this, check, callback ), 100 );
        }

        return callback();
      });
    }
  })
};