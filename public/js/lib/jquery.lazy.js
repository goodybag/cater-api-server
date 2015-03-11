console.log('jquery.lazy loaded');

(function(factory){
  if ( typeof define === 'function' && define.amd ){
    // AMD. Register as an anonymous module.
    define( ['jquery'], factory );
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function( $ ){
  'use strict';

  $.fn.lazy = function() { 
    this.each(function(idx, el) { 
      var $el = $(el);
      $el.css( 'background-image', "url(':url')".replace(':url', $el.data('pic')) )
    });
  };
}));

