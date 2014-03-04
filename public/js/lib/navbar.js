/**
 * Component.Navbar
 *
 * Applies the navbar events
 *
 * Returns an interface to control the navbar:
 *   Methods: init|expand|collapse|toggle
 *
 * Options:
 *   `collapsedClass` - Class name to use to specifiy collapsedness
 *   `toggleSelector` - Selector for the element that toggles
 */

define(function(require){
  'use strict';

  var $ = require('jquery');

  $.fn.navbar = function( options ){
    var $window = $(window);
    var $this = this;

    var defaults = {
      collapsedClass: 'collapsed'
    , toggleSelector: '.navbar-toggle'
    , onExpand: function( navbar, $el ){}
    , onCollapse: function( navbar, $el ){}
    };

    options = $.extend( {}, defaults, options );

    var navbar = {
      init: function(){
        $this.find( options.toggleSelector ).click( function( e ){
          navbar.toggle();
        });

        return navbar;
      }

    , isCollapsed: function(){
        return $this.hasClass( options.collapsedClass )
      }

    , expand: function(){
        $this.removeClass( options.collapsedClass );
        options.onExpand( navbar, $this );
        return navbar;
      }

    , collapse: function(){
        $this.addClass( options.collapsedClass );
        options.onCollapse( navbar, $this );
        return navbar;
      }

    , toggle: function(){
        return navbar[ navbar.isCollapsed() ? 'expand' : 'collapse' ]();
      }
    };

    return navbar.init();
  };
});