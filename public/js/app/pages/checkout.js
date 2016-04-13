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

      if( $('.list-group').height() > $('.order-summary').height() ) {
        page.affixOrderSummary();
      }

      analytics.page('Checkout');
    },

    affixOrderSummary: function () {
      $('.order-summary').affix({
        offset: {
          top: function () { return $('.list-group').offset().top - 42 }
        , bottom: 202
        }
      });

    }
  };

  return page;
});
