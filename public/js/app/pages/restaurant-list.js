define( function( require ){
  var $               = require('jquery');
  var utils           = require('utils');
  var restaurants     = require('data/restaurants');
  var OrderParams     = require('data/order-params');


  require('bootstrap');

  var Views = {
    OrderParamsView:          require('app/views/order-params-view')
  , RestaurantFiltersView:    require('app/views/restaurant-filters-view')
  , RestaurantSortView:       require('app/views/restaurant-sort-view')
  , RestaurantsListView:      require('app/views/restaurants-list-view')
  };

  var page = {
    init: function() {
      $(".tag-tooltip").tooltip();

      // Prepare listing to be usable by the facet serach
      utils.each( restaurants, function( r ){
        // Facet values need to be arrays
        r.prices = [r.price];
      });

      // Get existing filter criteria from the URL Parameters
      var existingCriteria = utils.parseQueryParams();

      // The URL parameters don't match up with the actual restaurant fields
      utils.each({
        mealStyles: 'meal_styles'
      , mealTypes:  'meal_types'
      , diets:      'tags'
      , cuisines:   'cuisine'
      }, function( newName, oldName, obj ){
        if ( obj[ oldName ] ){
          obj[ newName ] = obj[ oldName ];
          delete obj[ oldName ];
        }
      });

      if ( existingCriteria.prices ){
        utils.each( existingCriteria.prices, function( p, i, pp ){ pp[ i ] = +p; } );
      }

      var orderParams = new OrderParams();

      var orderParamsView = new Views.OrderParamsView({
        model: orderParams
      , el: '.order-params-bar'
      });

      var restaurantFiltersView = new Views.RestaurantFiltersView({
        el: '#filters'
      , existingCriteria: existingCriteria
      , restaurants: restaurants
      });

      var restaurantSortView = new Views.RestaurantSortView({
        el: '#sort'
      });

      var restaurantsListView = new Views.RestaurantsListView({
        el: '#main'
      , filtersView: restaurantFiltersView
      , sortView: restaurantSortView
      , paramsView: orderParamsView
      , searchUrl: '/restaurants'
      });
    }
  };

  return page;
});