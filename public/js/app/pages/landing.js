define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');
  var Handlebars = require('handlebars');

  var utils = require('utils');

  var Views = {
    OrderParamsView: require('app/views/order-params-view')
  }

  var page = {
    init: function(){
      $(function(){
        $('.navbar').navbar({
          toggleText: ''
        });

        $('.register-form').fieldMatcher({
          fields: ['password', 'password2']
        , onError: function( matcher, $form ){
            $form.find('.errors').html('<p class="error">Passwords must match</p>');
          }
        });

        page.orderParamsView = new Views.OrderParamsView({
          el:         $('.restaurant-search-panel')[0]
        , template:   Handlebars.partials.restaurant_search_main
        , requireZip: true
        });

        page.orderParamsView.on('params:submit', function(){
          window.location.href = [
            '/restaurants'
          , utils.queryParams( page.orderParamsView.getProps() )
          ].join('');
        });

        analytics.page('Landing');
      });
    }
  };

  return page;
});