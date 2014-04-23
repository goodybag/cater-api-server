/**
 * jQuery toggler
 * Toggles text and an active class on elements on some event
 */

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

  $.fn.toggler = function( options ){
    var $this = this;
    var $body = $( document.body );

    var defaults = {
      activeClassName: 'active'
    , toggleEvent: 'click'
    };

    options = $.extend( {}, defaults, options );

    if ( $this.length > 1 ){
      return $this.each( function(){
        $.fn.toggler.call( this, options );
      });
    }

    if ( $this.data('toggle') ){
      options.toggleText = $this.data('toggle');
    }

    var plugin = {
      $this: $this

    , active: false

    , originalText: $this.text()

    , init: function(){
        $this.on( options.toggleEvent, plugin.toggle );
        return plugin;
      }

    , toggle: function(){
        return plugin[ ( plugin.active ? 'de' : '' ) + 'activate' ]();
      }

    , activate: function(){
        plugin.active = true;
        $this.addClass( options.activeClassName )
        $this.text( options.toggleText );
        return plugin;
      }

    , deactivate: function(){
        plugin.active = false;
        $this.removeClass( options.activeClassName )
        $this.text( plugin.originalText );
        return plugin;
      }
    };

    return plugin.init();
  };
}));