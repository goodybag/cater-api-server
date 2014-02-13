define(function(require){
  var $ = require('jquery');

  var page = {
    init: function(){
      $(function(){
        var $navbar = $('.navbar');
        var $login  = $navbar.find('.login-form');
        var $toggle = $('.navbar-toggle');
        var tText   = $toggle.text();

        var expandNavbar = function(){
          $navbar.removeClass('collapsed');
          $login.removeClass('form-small');
          $login.addClass('form-vertical');
          $toggle.text('Close');
        };

        var collapseNavbar = function(){
          $navbar.addClass('collapsed');
          $login.removeClass('form-vertical');
          $login.addClass('form-small');
          $toggle.text( tText );
        };

        $toggle.click( function( e ){
          if ( $navbar.hasClass('collapsed') ){
            expandNavbar();
          } else {
            collapseNavbar();
          }
        });
      });
    }
  };

  return page;
});