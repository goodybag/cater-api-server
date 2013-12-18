define( function( require ){
  var $               = require('jquery');
  var user            = require('data/user');
  var marketPlaceUri  = require('data/marketplaceUri');

  require('bootstrap');

  var Views = {
    AddPaymentMethod: require('app/views/add-payment-method')
  };

  var page = {
    init: function() {
      balanced.init(marketPlaceUri);

      var addPaymentMethodView = new Views.AddPaymentMethod({
        el:       '.add-payment-method'
      , user:     user
      });
    }
  };

  return page;
});