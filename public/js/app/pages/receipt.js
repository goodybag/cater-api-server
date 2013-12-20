define(function(require){
  var utils = require('utils')
  var order = require('data/order')

  var Views = {
    Receipt:    require('app/views/receipt-view')
  , OrderItem:  require('app/views/order-item-view')
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
    init: function(){
      page.view = new Views.Receipt({
        el:           '#main'
      , model:        order
      , review_token: query.review_token
      });

      order.orderItems.each( function( item ){
        new Views.OrderItem({
          el:     '#order-item-' + item.get('id')
        , model:  item
        })
      });

      utils.startHistory();
    }
  };

  return page;
});