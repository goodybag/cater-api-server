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
 *   `loginSelector`  - Selector for the login form
 *   `toggleSelector` - Selector for the element that toggles
 *   `toggleText`     - If non-falsey, sets text of toggleSelector onExpand
 *   `toggleLogin`    - If true, toggles login: form-small/form-vertical
 *                      Necessary for showing a nicer looking login form on expand
 *   `onExpand`       - (navbar, $el) called after expansion
 *   `onCollapse`     - (navbar, $el) called after collapse
 */

define(function(require){
  'use strict';

  var $ = require('jquery');

  $.fn.navbar = function( options ){
    if ( this.length > 1 ){
      return this.each( function(){
        $(this).navbar( options );
      });
    }

    var $window = $(window);
    var $this = this;

    var defaults = {
      collapsedClass: 'collapsed'
    , loginSelector:  '.login-form'
    , toggleSelector: '.navbar-toggle'
    , toggleText:     'Close'
    , toggleLogin:    true
    , onExpand:       function( navbar, $el ){}
    , onCollapse:     function( navbar, $el ){}
    };

    options = $.extend( {}, defaults, options );

    var $toggle = $this.find( options.toggleSelector );
    var $login  = $this.find( options.loginSelector );

    options.currText = $toggle.text();

    var navbar = {
      init: function(){
        $toggle.click( function( e ){
          navbar.toggle();
        });

        return navbar;
      }

    , isCollapsed: function(){
        return $this.hasClass( options.collapsedClass )
      }

    , expand: function(){
        $this.removeClass( options.collapsedClass );

        if ( options.toggleText ){
          $toggle.text( options.toggleText );
        }

        if ( options.toggleLogin ){
          $login.removeClass('form-small');
          $login.addClass('form-vertical');
        }

        options.onExpand( navbar, $this );
        return navbar;
      }

    , collapse: function(){
        $this.addClass( options.collapsedClass );

        if ( options.toggleText ){
          $toggle.text( options.currText );
        }

        if ( options.toggleLogin ){
          $login.removeClass('form-vertical');
          $login.addClass('form-small');
        }

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