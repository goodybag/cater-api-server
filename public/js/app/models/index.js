define(function(require){
  return {
    Address:            require('./address')
    // Hide Category for now due to clyclic dependency
  // , Category:           require('./category')
  , ContactUs:          require('./contact-us')
  , Hours:              require('./hours')
  , Item:               require('./item')
  , OrderItem:          require('./order-item')
  , OrderParams:        require('./order-params')
  , Order:              require('./order')
  , PaymentMethod:      require('./payment-method')
  , RestaurantEvent:    require('./restaurant-event')
  , Restaurant:         require('./restaurant')
  , User:               require('./user')
  };
});