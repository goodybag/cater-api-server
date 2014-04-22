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

  $.fn.rowExpand = function( options ){
    var $this = this;
    var $body = $( document.body );

    var defaults = {
      wrapWith: '<tr><td colspan="{{colspan}}"></td></tr>'
    , wrapTarget: 'td'
    , animate: true
    , wrapperPreCSS: {
        opacity: 0
      , width: '100%'
      }
    , wrapperPostCSS: {
        opacity: 1
      }
    };

    options = $.extend( {}, defaults, options );

    if ( typeof options.template !== 'function' )
    if ( !options.srcElement ){
      throw new Error('Must provide `template` or `srcElement` properties');
    }

    if ( typeof options.srcElement === 'string' ){
      options.srcElement = $( options.srcElement );
    }

    var plugin = {
      init: function(){
        return plugin;
      }

    , getColSpan: function(){
        return $this.find('td').length;
      }

    , expand: function(){
        var initialHeight;

        plugin.collapse();

        plugin.$this = $(
          options.wrapWith.replace( '{{colspan}}', plugin.getColSpan() )
        );

        ( options.wrapTarget ?
          plugin.$this.find( options.wrapTarget ) : plugin.$this
        ).html( plugin.getInnerHTML() );

        plugin.$this.css(
          $.extend( options.wrapperPreCSS, { position: 'absolute' } )
        );

        $this.after( plugin.$this );

        initialHeight = plugin.$this.height() + 'px';

        plugin.$this.css({
          height:   0
        , position: 'static'
        });

        setTimeout( function(){
          plugin.$this[ options.animate ? 'animate' : 'css' ](
            $.extend( options.wrapperPostCSS, { height: initialHeight } )
          );
        }, 1 );

        return plugin;
      }

    , collapse: function(){
        if ( plugin.$this ){
          var $el = plugin.$this;
          var cleanup = function(){
            $el.remove();
          };

          $el[ options.animate ? 'animate' : 'css' ](
            $.extend( options.wrapperPreCSS, { height: 0 } )
          , options.animate ? cleanup : null
          );

          if( !options.animate ) cleanup();

          delete plugin.$this;
        }

        return plugin;
      }

    , getInnerHTML: function(){
        if ( options.template ) return options.template();
        return options.srcElement.html();
      }
    };

    return plugin.init();
  };
}));