/**
 * GB Dropdown
 */

if (typeof module === 'object' && typeof define !== 'function') {
  var define = function(factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require){
  var $ = require('jquery');

  var options = {
    className:        'gb-dropdown'
  , activeClassName:  'active'
  };

  var exports = {
    options: options

  , init: function(){
      $( '.' + options.className ).click( function(){
        $(this).toggleClass( options.activeClassName );
      });
    }
  };

  $( exports.init );

  return exports;
});