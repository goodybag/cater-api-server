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
      var amenities       = options.amenities;

      page.options = options;

      balanced.init(marketPlaceUri);

      var view = new Views.CheckoutView({
        el: '#main',
        model: order,
        user: user,
        amenities: amenities
      });

      analytics.page('Checkout');
    }
  };

  return page;
});