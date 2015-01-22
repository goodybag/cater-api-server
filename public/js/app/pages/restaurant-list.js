define( function( require ){
  var $               = require('jquery-loaded');
  var utils           = require('utils');

  var page = {
    init: function(options) {
      var ListView = require('app/views/restaurants-list-view');
      var SortView = require('app/views/restaurant-sort-view');
      var OrderParamsView = require('app/views/order-params-view')
      var OrderParams = require('app/models/order-params');
      var FiltersView = require('app/views/restaurant-filters-view');
      var SearchView = require('app/views/restaurant/search-view');

      var sortView = new SortView({
        el: '#sort'
      , inputSelector: '[name="list-sort"]:checked'
      });

      var listView = new ListView({
        el: '#main'
      , searchUrl: '/restaurants'
      });

      var orderParamsView = new OrderParamsView({
        model: new OrderParams()
      , el: '.restaurant-params'
      });

      var filtersView = new FiltersView({ el: '#filters' });

      var searchView = new SearchView({
        el: '#search'
      , inputSelector: '.search-input'
      });

      listView.addFilter(sortView);
      listView.addFilter(orderParamsView);
      listView.addFilter(filtersView);
      listView.addFilter(searchView);

      $('[data-role="collapsible"]').gb_collapsible();
    }
  };

  return page;
});
