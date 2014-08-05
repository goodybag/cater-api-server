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

  $.fn.modernModal = function( options ){
    var $this = this;
    var $body = $( document.body );

    var defaults = {
      backdropClassName: 'modal-backdrop'
    , closeClassName: ''
    , activeClassName: 'in'
    , hideBackdropDelay: 500
    };

    options = $.extend( {}, defaults, options );

    var plugin = {
      $this: $this
    , $copy: null
    , $backdrop: null

    , init: function(){
        return plugin;
      }

    , open: function(){
        if ( !plugin.$backdrop ){
          plugin.$backdrop = $('<div />').addClass( options.backdropClassName );
          document.body.appendChild( plugin.$backdrop[0] );
          plugin.backdropInitialDisplay = getComputedStyle( plugin.$backdrop[0] ).display;
          plugin._applyBackdropEvents();
        }

        if ( plugin.$backdrop.css('display') !== plugin.backdropInitialDisplay ){
          plugin.$backdrop.css( 'display', plugin.backdropInitialDisplay );
          setTimeout( plugin.open, 1 );
          return plugin;
        }

        if ( !plugin.$copy ){
          plugin.$copy = $this.clone();
          plugin.$backdrop.append( plugin.$copy );
        }

        plugin.$copy.css( 'display', 'block' );

        // Wait till display: block; has taken effect
        setTimeout( function(){
          plugin.$backdrop.addClass('in');
        }, 1 );

        return plugin;
      }

    , close: function(){
        plugin.$backdrop.removeClass('in');

        setTimeout(
          plugin.$backdrop.css.bind( plugin.$backdrop, 'display', 'none' )
        , options.hideBackdropDelay
        );

        plugin.$this.trigger('close');

        return plugin;
      }

    , _applyBackdropEvents: function(){
        plugin.$backdrop.click( plugin.close );
      }
    };

    return plugin.init();
  };
}));