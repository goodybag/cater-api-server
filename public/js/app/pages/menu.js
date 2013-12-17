define( function( require ){
  var $               = require('jquery')
  var orderModel      = require('order');
  var orderParams     = require('order-params');
  var restaurant      = require('restaurant');
  var defaultAddress  = require('default-address');
  var user            = require('user');

  require('bootstrap');

  var Views = {
    Item:               require('app/views/item-view')
  , OrderParams:        require('app/views/order-params-view')
  , OrderSummary:       require('app/views/order-summary-view')
  , OrderItemSummary:   require('app/views/order-item-summary-view')
  , ItemModal:          require('app/views/item-modal')
  , OrderModal:         require('app/views/order-modal')
  , RestaurantMap:      require('app/views/restaurant-map-view')
  , MenuOrderParams:    require('app/views/menu-order-params-view')
  , Menu:               require('app/views/menu-view')
  };

  return {
    init: function(){
      var paramsView = new Views.OrderParams({
        model:  orderParams
      , el:     '.order-params-bar'
      });

      var orderModal = new Views.OrderModal({
        model:          orderModel
      , el:             '#order-params-modal'
      , loginNeeded:    !user.get('id')
      , defaultAddress: defaultAddress
      , orderModel:     orderModel
      });

      var itemModalView = new Views.ItemModal({
        el:         '#item-modal'
      , orderItems: orderModel.orderItems
      , orderModel: orderModel
      , orderModal: orderModal
      });

      var restaurantMapView = new Views.RestaurantMap({
        el:   '.restaurant-map'
      , model: restaurant
      });

      // render map on info tab click
      $('a.info-tab[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        restaurantMapView.render();
      });

      var orderView = new Views.OrderSummary({
        el:                 '.order-summary'
      , model:              orderModel
      , itemModalView:      itemModalView
      , orderParams:        orderParams
      , restaurantMapView:  restaurantMapView
      });

      orderModel.orderItems.each( function( item ){
        new Views.OrderItemSummary({
          el:             '#order-item-' + item.get('id')
        , model:          item
        , itemModalView:  itemModalView
        });
      });

      restaurant.categories.each( function( category ){
        category.items.each( function( item ){
          new Views.Item({
            el:             '#item-' + item.get('id'),
            model:          item,
            itemModalView:  itemModalView,
            orderModel:     orderModel,
            orderModal:     orderModal,
            orderParams:    orderParams
          });
        });
      });

      orderView.render();

      var menuView = new Views.Menu({
        el: '#menu'
      , model: restaurant
      });

      var menuOrderParamsView = new Views.MenuOrderParams({
        el: '.menu-order-params'
      , model: orderModel
      , orderModal: orderModal
      });

      $('.tag-tooltip').tooltip();
    }
  };
});