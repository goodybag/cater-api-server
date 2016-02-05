define( function( require ){
  var utils = require('utils');
  var $     = require('jquery-loaded');

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

      var view = new Views.CheckoutView({
        el: '#main',
        model: order,
        user: user,
        amenities: amenities
      });

      page.affixOrderSummary();

      analytics.page('Checkout');
    },

    affixOrderSummary: function () {
      $('.order-summary').affix({
        offset: {
          top: function () { return $('.list-group').offset().top }
        , bottom: 225
        }
      });

    }
  };

  return page;
});