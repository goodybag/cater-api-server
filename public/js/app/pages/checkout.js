define( function( require ){
  var utils = require('utils');

  var Views = {
    CheckoutView:       require('app/views/checkout-view')
  };

  var page = {
    init: function(options) {
      var marketPlaceUri  = options.marketplaceUri;
      var user            = options.user;
      var order           = options.order;

      page.options = options;

      balanced.init(marketPlaceUri);

      var view = new Views.CheckoutView({
        el: '#main',
        model: order,
        user: user
      });

      analytics.page('Checkout');
    }
  };

  return page;
});