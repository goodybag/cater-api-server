define( function( require ){
  var $               = require('jquery');
  var user            = require('data/user');
  var marketPlaceUri  = require('data/marketplaceUri');

  require('bootstrap');

  var Views = {
    PaymentMethodsView: require('app/views/payment-methods-view')
  };

  var page = {
    init: function() {
      balanced.init(marketPlaceUri);

      var paymentMethodsView = new Views.PaymentMethodsView({
        el:       '#payment-methods'
      , user:     user
      });
    }
  };

  return page;
});