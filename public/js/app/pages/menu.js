define( function( require ){
  var $               = require('jquery')
  var utils           = require('utils')
  var orderModel      = require('data/order');
  var orderParams     = require('data/order-params');
  var restaurant      = require('data/restaurant');
  var defaultAddress  = require('data/default-address');
  var user            = require('data/user');

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

  orderParams.set( utils.parseQueryParams() );

  if ( orderModel.get('is_pickup') ) orderParams.set('order_type', 'pickup');

  var page = {
    init: function(){
      page.view = new Views.Menu({
        el:     '#menu'
      , model:  restaurant
      });

      var paramsView = new Views.OrderParams({
        model:  orderParams
      , orderModel:     orderModel
      , el:     '.order-params-bar'
      });

      var orderModal = new Views.OrderModal({
        model:            orderModel
      , el:               '#order-params-modal'
      , loginNeeded:      !user.get('id')
      , defaultAddress:   defaultAddress
      , orderModel:       orderModel
      , orderParams:      orderParams
      , orderParamsView:  paramsView
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

      var menuOrderParamsView = new Views.MenuOrderParams({
        el: '.menu-order-params'
      , model: orderModel
      , orderModal: orderModal
      });

      $('.tag-tooltip').tooltip();
    }
  };

  return page;
});