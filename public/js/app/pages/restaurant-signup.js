define ( function (require) {
  var BasicInfoView = require('../views/restaurant/join/basic-info-view');
  var RestaurantInfoView = require('../views/restaurant/join/restaurant-info-view');
  var DeliveryPickupView = require('../views/restaurant/join/delivery-pickup-view');
  var PaymentInfoView = require('../views/restaurant/join/payment-info-view');

  var Restaurant = require('../models/restaurant');

  var page = {
    init: function ( options ) {
      var step = options.step || 1; 
      var viewOptions = {
        el: '#restaurant-join'
      , model: new Restaurant()
      };
      switch (parseInt(step)) {
        case 1:
          var basicInfo = new BasicInfoView(viewOptions);
          break;
        case 2:
          var restaurantInfo = new RestaurantInfoView(viewOptions);
          break;
        case 3:
          var deliveryPickup = new DeliveryPickupView(viewOptions);
          break;
        case 4:
          var paymentInfo = new PaymentInfoView(viewOptions);
          break;
      }
    }
  };

  return page;
});