define( function( require ){
  var $               = require('jquery');
  var utils           = require('utils');
  var allRestaurants  = require('data/all-restaurants');

  require('bootstrap');

  var Models = {
    OrderParams:              require('app/models/order-params')
  , FavoriteRestaurant:       require('app/models/favorite-restaurant')
  };

  var Views = {
    OrderParamsView:          require('app/views/order-params-view')
  , RestaurantFiltersView:    require('app/views/restaurant-filters-view')
  , RestaurantSortView:       require('app/views/restaurant-sort-view')
  , RestaurantsListView:      require('app/views/restaurants-list-view')
  , RestaurantFavoritesView:  require('app/views/restaurant/favorites-view')
  , RestaurantView:           require('app/views/restaurant/restaurant-view')
  };

  var page = {
    init: function(options) {
      var restaurants = options.restaurants;

      $(".tag-tooltip").tooltip();

      // Prepare listing to be usable by the facet serach
      utils.each( restaurants, function( r ){
        // Facet values need to be arrays
        r.prices = [r.price];
      });

      utils.each( allRestaurants, function( r ){
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

      var orderParams = new Models.OrderParams();

      var orderParamsView = new Views.OrderParamsView({
        model: orderParams
      , el: '.order-params-bar'
      });

      var restaurantFiltersView = new Views.RestaurantFiltersView({
        el: '#filters'
      , existingCriteria: existingCriteria
      , restaurants: allRestaurants
      });

      var restaurantSortView = new Views.RestaurantSortView({
        el: '#sort'
      });

      var restaurantFavoritesView = new Views.RestaurantFavoritesView({
        el: '#favorites'
      });

      var restaurantsListView = new Views.RestaurantsListView({
        el: '#main'
      , filtersView: restaurantFiltersView
      , sortView: restaurantSortView
      , paramsView: orderParamsView
      , favoritesView: restaurantFavoritesView
      , searchUrl: '/restaurants'
      });

      var restaurantViews = utils.map(restaurants, function(restaurant) {
        return new Views.RestaurantView({
          el: '#restaurant-' + restaurant.id
        , model: new Models.FavoriteRestaurant({
            restaurantId: restaurant.id
          , userId: options.userId
          , favorite: restaurant.favorite
          })
        });
      });
    }
  };

  return page;
});
