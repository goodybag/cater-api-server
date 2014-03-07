define(function(require){
  var utils = require('utils')

  var Views = {
    Receipt:    require('app/views/receipt-view')
  , OrderItem:  require('app/views/order-item-view')
  };

  var query = utils.parseQueryParams();

  var page = {
    init: function( options ){
      var order = options.order;

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

      page.action();
    },

    /**
     * Change status based on url hash
     */
    action: function() {
      var action = window.location.hash.replace('#action/', '');
      switch ( action ) {
        case 'accept':
          page.view.changeStatus('accepted');
          break;
        case 'reject':
          $("#reject-confirm-modal").modal('show');
          break;
      }
    }
  };

  return page;
});
