define(function(require, exports, module) {
  module.exports = [
    { component: require('./basic-info'), name: 'Basic Info' }
  , { component: require('./restaurant-info'), name: 'Restaurant Info' }
  , { component: require('./delivery-pickup'), name: 'Delivery + Pickup' }
  ];
});