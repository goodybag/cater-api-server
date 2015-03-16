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
      // 1. attach scroll listeners to each $el
      var isScrolledIntoView = function(e){ 
        var docViewTop = $window.scrollTop();
        var docViewBottom = docViewTop + $window.height();
        var elTop = $el.offset().top;
        var elBottom = elTop + $el.height();

        return ((elBottom <= docViewBottom) && (elTop >= docViewTop));
      }

      $window.bind( 'scroll', isScrolledIntoView )
      
      // 2. in the scroll callback, check if $el is in view
      // 3. replace background-image
    });
  };
}));






