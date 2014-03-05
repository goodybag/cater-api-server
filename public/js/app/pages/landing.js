define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');

  var page = {
    init: function(){
      $(function(){
        var $login  = $('.navbar .login-form');
        var $toggle = $('.navbar-toggle');
        var tText   = $toggle.text();

        $('.navbar').navbar({
          onExpand: function( nav, $el ){
            $login.removeClass('form-small');
            $login.addClass('form-vertical');
            $toggle.text('Close');
          }

        , onCollapse: function( nav, $el ){
            $login.removeClass('form-vertical');
            $login.addClass('form-small');
            $toggle.text( tText );
          }
        });

        $('.register-form').fieldMatcher({
          fields: ['password', 'password2']
        , onError: function( matcher, $form ){
            $form.find('.errors').html('<p class="error">Passwords must match</p>');
          }
        });

        $('#section-restaurants .btn-call-to-action').click( function( e ){
          e.preventDefault();

          $('body').animate({ scrollTop: 0 }, function(){
            $('#register-email').focus();
          });
        });

        analytics.page('Landing');
      });
    }
  };

  return page;
});