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
      var PagerView = require('app/views/restaurant/pager-view');
      var ToggleClassView = require('app/views/toggle-class-view');

      var sortView = new SortView({
        el: '#sort'
      , inputSelector: '[name="list-sort"]:checked'
      });

      var orderParamsView = new OrderParamsView({
        model: new OrderParams()
      , el: '.restaurant-params'
      });

      var filtersView = new FiltersView({
        el: '.search-advanced'
      , facets: {
          cuisines:   '.filter-cuisines input[type="checkbox"]:checked'
        , diets:      '.filter-diets input[type="checkbox"]:checked'
        , mealTypes:  '.filter-meal-types input[type="checkbox"]:checked'
        }
      });

      var searchView = new SearchView({
        el: '#search'
      , inputSelector: '.search-input'
      });

      var pagerView = new PagerView({
        el: '.list-paginator'
      , inputSelector: '[name="list-pager"]:checked'
      });

      var listView = new ListView({
        el: '#main'
        , searchUrl: ''
        , filters: [
            sortView
          , orderParamsView
          , filtersView
          , searchView
          , pagerView
          ]
      });

      var toggleClassView = new ToggleClassView({
        el: '#main'
      , trigger: '.btn-toggle-list'
      , targetSelector: '.restaurant-toggle-list'
      , cookie: 'gb_display'
      });

      $('.search-advanced .btn-search').click(listView.search.bind(listView));
      $('.btn-toggle-list').click(toggleClassView.toggle.bind(toggleClassView));

      $('[data-role="collapsible"]').gb_collapsible();

      // reuse bootstrap tooltip for now
      $('[data-toggle="tooltip"]').tooltip();
    }
  };

  return page;
});
