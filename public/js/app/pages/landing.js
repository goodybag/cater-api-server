define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');

  var page = {
    init: function(){
      $(function(){
        $('.navbar').navbar();

        $('.register-form').fieldMatcher({
          fields: ['password', 'password2']
        , onError: function( matcher, $form ){
            $form.find('.errors').html('<p class="error">Passwords must match</p>');
          }
        });

        analytics.page('Landing');
      });
    }
  };

  return page;
});