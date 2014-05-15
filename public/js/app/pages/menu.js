define( function( require ){
  var $ = require('jquery')

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
  , MenuShareLink:      require('app/views/menu-share-link-view')
  , Menu:               require('app/views/menu-view')
  };

  var page = {
    init: function( options ){
      var orderModel      = options.order;
      var orderParams     = options.orderParams;
      var restaurant      = options.restaurant;
      var defaultAddress  = options.defaultAddress;
      var user            = options.user;
      var editToken       = options.editToken;
      var baseUrl         = options.baseUrl;
      window.orderModel = orderModel;
      analytics.page('Menu', {restaurant: restaurant.pick('name')});

      page.view = new Views.Menu({
        el:     '#menu'
      , model:  restaurant
      });

      var paramsView = new Views.OrderParams({
        model:  orderParams
      , el:     '.order-params-bar'
      });

      var orderModal = new Views.OrderModal({
        model:          orderModel
      , el:             '#order-params-modal'
      , defaultAddress: defaultAddress
      , orderModel:     orderModel
      , restaurant:     restaurant
      });

      var itemModalView = new Views.ItemModal({
        el:         '#item-modal'
      , orderItems: orderModel.orderItems
      , orderModel: orderModel
      , orderModal: orderModal
      , isAdmin:    user.attributes.groups.indexOf('admin') >= 0
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
      , editToken:          editToken
      });

      orderModel.orderItems.each( function( item ){
        new Views.OrderItemSummary({
          el:             '#order-item-' + item.get('id')
        , model:          item
        , itemModalView:  itemModalView
        });
      });

      // todo: orderModel.restaurant should not come from models.order
      orderModel.restaurant.set('eventDateRanges', restaurant.get('event_date_ranges'));

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
        el:           '.menu-order-params'
      , model:        orderModel
      , orderModal:   orderModal
      });

      var menuShareLinkView = new Views.MenuShareLink({
        el:           '.menu-share-link'
      , editToken:    editToken
      , model:        orderModel
      , restaurant:   restaurant
      , baseUrl:      baseUrl
      });

      $('.tag-tooltip').tooltip();
    }
  };

  return page;
});
