define(function(require){
  var utils = require('utils')

  var Views = {
    Receipt:    require('app/views/receipt-view')
  , OrderItem:  require('app/views/order-item-view')
  , OrderFeedback: require('app/views/order-feedback-view')
  };

  var Router = utils.Router.extend({
    routes: {
      'action/:action': 'onAction'
    }

  , onAction: function( action ){
      if ( action === 'accept' ){
        utils.history.navigate('/');
        return page.view.changeStatus('accepted');
      }

      if ( action === 'reject' ){
        utils.history.navigate('/');
        return $("#reject-confirm-modal").modal('show');
      }
    }
  });

  var router = new Router();

  var query = utils.parseQueryParams();

  var page = {
    init: function( options ){
      var order = options.order;
      var isAdmin = options.isAdmin;
      var amenities = options.amenities;

      page.view = new Views.Receipt({
        el:               '#main'
      , model:            order
      , review_token:     query.review_token
      , validate:         !isAdmin
      , amenities:        amenities
      });

      order.orderItems.each( function( item ){
        new Views.OrderItem({
          el:     '#order-item-' + item.get('id')
        , model:  item
        })
      });

      new Views.OrderFeedback({
        el: '.feedback-order'
      , model: order
      });

      utils.startHistory();
    }
  };

  return page;
});
