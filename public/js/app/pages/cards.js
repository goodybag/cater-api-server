define( function( require ){
  var $ = require('jquery');

  require('bootstrap');

  var Views = {
    PaymentMethodsView: require('app/views/payment/payment-methods-view')
  , RemoveCardModal:    require('app/views/payment/remove-card-modal')
  };

  var page = {
    init: function(options) {
      var user            = options.user;

      var removeCardModal = new Views.RemoveCardModal({
        el: '#remove-card-modal'
      });

      var paymentMethodsView = new Views.PaymentMethodsView({
        el:                 '#payment-methods'
      , user:               user
      , removeCardModal:    removeCardModal
      });
    }
  };

  return page;
});
