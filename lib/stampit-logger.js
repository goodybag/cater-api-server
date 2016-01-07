var stampit = require('stampit');
var logger = require('./logger');

module.exports = function( name ){
  return stampit()
    .enclose( function(){
      Object.defineProperty( this, 'logger', {
        enumerable: false
      , value: ( this.logger || logger ).create( name )
      });
    });
};