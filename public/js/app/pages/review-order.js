define( function( require ){
  var utils = require('utils');

  var Views = {
    OrderView:          require('app/views/order-view')
  , OrderItemView:      require('app/views/order-item-view')
  };

  var page = {
    init: function(options) {
      var order         = options.order;
      var orderItems    = options.orderItems;
      var isAdmin       = options.isAdmin;

      var query = utils.parseQueryParams();

      var view = new Views.OrderView({
        el: $('#main')
      , model: order
      , review_token: query.review_token
      , validate: !isAdmin
      , amenities: []
      });

      orderItems = utils.map(orderItems, function(orderItem) {
        return new Views.OrderItemView({
          el:           $('#order-item-'+orderItem.id)
        , model:        view.model.orderItems.get(orderItem.id)
        , orderView:    view
        });
      });

      view.setItems(orderItems);

      analytics.page('Review Order');
    }
  };

  return page;
});