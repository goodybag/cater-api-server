define ( function (require) {
  var _ = require('lodash');
  var BasicInfoView = require('../views/restaurant/signup/basic-info-view');
  var RestaurantInfoView = require('../views/restaurant/signup/restaurant-info-view');
  var DeliveryPickupView = require('../views/restaurant/signup/delivery-pickup-view');
  var PaymentInfoView = require('../views/restaurant/signup/payment-info-view');
  var EditLeadTimesView = require('../views/restaurant/edit-lead-times-view');

  var Restaurant = require('../models/restaurant');

  var page = {
    init: function ( options ) {
      var step = options.step || 1; 
      page.model = options.model || new Restaurant();

      var viewOptions = {
        el: '#restaurant-signup'
      , model: page.model
      };

      switch (parseInt(step)) {
        case 1:
          page.basicInfoView = new BasicInfoView(viewOptions);
          break;
        case 2:
          page.restaurantInfoView = new RestaurantInfoView(viewOptions);
          break;
        case 3:
          page.deliveryLeadTimesView = new EditLeadTimesView({
              el: '.delivery-lead-times-container'
            , model: page.model
            });
          page.pickupLeadTimesView = new EditLeadTimesView({
              el: '.pickup-lead-times-container'
            , model: page.model
            });

          page.deliveryPickupView = new DeliveryPickupView(_.extend(viewOptions, {
            deliveryLeadTimesView: page.deliveryLeadTimesView
          , pickupLeadTimesView: page.pickupLeadTimesView
          }));

          break;
        case 4:
          var paymentInfo = new PaymentInfoView(viewOptions);
          break;
      }
    }
  };

  return page;
});