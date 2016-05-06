define( function( require ){
  var $ = require('jquery-loaded');
  var utils = require('utils');
  var api = require('api');
  var flash = require('flash');
  var ListView = require('app/views/restaurants-list-view');
  var SortView = require('app/views/restaurant-sort-view');
  var OrderParamsView = require('app/views/order-params-view')
  var OrderParams = require('app/models/order-params');
  var FiltersView = require('app/views/restaurant-filters-view');
  var SearchView = require('app/views/restaurant/search-view');
  var PagerView = require('app/views/restaurant/pager-view');
  var ToggleClassView = require('app/views/toggle-class-view');
  var OrderEditorView = require('app/views/order-flow-order-editor');

  var page = {
    init: function(options) {
      var sortView = new SortView({
        el: '#sort'
      , inputSelector: '[name="list-sort"]:checked'
      });

      var editor = new OrderEditorView({
        el: '#order-editor'
      , order_id: options.order.id
      , clearRestaurant: true
      });

      editor.on('save', function( order ){
        window.location.reload();
      });

      // var orderParamsView = new OrderParamsView({
      //   model: new OrderParams()
      // , el: '.restaurant-params'
      // });

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
          // , orderParamsView
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

      $('.tile-link').click( function( e ){
        e.preventDefault();

        var id = $( e.currentTarget ).data('id');

        api.orders( options.order.id ).put({ restaurant_id: id }, function( error ){
          if ( error ){
            return console.error( error );
          }

          window.location.href = '/orders/' + options.order.id + '/add-items';
        });
      });

      // Fetch the order just in case they used the back button
      api.orders.get( options.order.id, function( error, order ){
        if ( error ){
          return;
        }

        if ( order.orderItems.length ){
          flash.info([
            '<h3>Hold on!</h3>'
          , '<p>We noticed that something was wrong. '
          , 'Let me refresh the page real quick!</p>'
          ].join('\n'), 3000, function(){
            window.location.reload();
          });
        }
      });
    }
  };

  return page;
});
