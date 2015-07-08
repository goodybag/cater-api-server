/**
 * jQuery.prefixer
 *
 * Prefixes things that jQuery doesn't, like animation events
 */

if (typeof module === 'object' && typeof define !== 'function') {
  var define = function(factory) {
    module.exports = factory(require, exports, module);
  };
}


define(function(require){
  var $ = require('jquery');
  var methods = [ 'bind', 'on', 'one', 'off' ];
  var prefixes = {
    'animationend':       ['webkitAnimationEnd', 'MSAnimationEnd', 'oAnimationEnd']
  , 'animationstart':     ['webkitAnimationStart', 'MSAnimationStart', 'oAnimationStart']
  , 'animationiteration': ['webkitAnimationIteration', 'MSAnimationIteration', 'oAnimationIteration']
  };

  var originals = {};

  var createFn = function( name ){
    var original = $.fn[ name ];

    $.fn[ name ] = function( evts ){
      // If they're not doing the string syntax, don't even try
      // I'm lazy and 99% of my use-cases uses string
      if ( typeof evts !== 'string' ){
        return original.apply( this, arguments );
      }

      evts = evts.split(' ');

      for ( var key in prefixes ){
        if ( evts.indexOf( key ) > -1 ){
          for ( var i = 0; i < prefixes[key].length; i++ ){
            if ( evts.indexOf( prefixes[key][i] ) > -1 ) continue;
            evts.push( prefixes[key][i] );
          }
        }
      }

      evts = evts.join(' ');

      return original.apply( this, [ evts ].concat( Array.prototype.slice.call( arguments, 1 ) ) );
    };
  };

  for ( var i = 0; i < methods.length; i++ ){
    createFn( methods[i] ); 
  }
});