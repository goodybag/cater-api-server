define( function( require ){
  var React = require('react');
  var utils = require('utils');
  var OrderSearch = require('/../../dist/order-search.js');
  var OrdersListView = require('app/views/orders-list-view');

  var page = {
    init: function( options ){
      page.options = options;

      var ordersListView = new OrdersListView({ el: '.orders-list' });

      React.render(
        React.createElement(OrderSearch, { endpoint: '/api/orders/search' })
      , document.getElementById('order-search')
      );

      $('#region-select').change( function( e ){
        options.queryParams['restaurants.region_id'] = $(this).val();
        page.navigate( '/orders' + utils.queryParams( options.queryParams ) );
      });
    }

  , navigate: utils.debounce( function( url ){
      window.location.href = url;
    }, 800 )
  };

  return page;
});
