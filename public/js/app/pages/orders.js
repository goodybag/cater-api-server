define( function( require ){
  var React = require('react');
  var OrderSearch = require('/../../dist/order-search.js');
  var OrdersListView = require('app/views/orders-list-view');

  var page = {
    init: function( options ){
      page.options = options;

      var ordersListView = new OrdersListView({ el: '.orders-list' });

      React.renderComponent(
        OrderSearch({ endpoint: '/api/orders/search' })
      , document.getElementById('order-search')
      );
    }
  };

  return page;
});
