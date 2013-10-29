/** 
 * Handles restaurant searching and filtering
 * by tags (diets, cuisine, meal types, price)
 * and order params (zip, delivery date/time, guests)
 */

var RestaurantsListView = Backbone.View.extend({
  initialize: function() {
    this.listenTo(this.options.paramsView, 'params:submit', this.search);
    this.listenTo(this.options.filtersView, 'filters:change', this.search);
  }

, search: function() {
    var props = _.extend( {}, this.options.filtersView.getProps(), this.options.paramsView.getProps() );
    var searchUrl = this.options.searchUrl;
    window.location = searchUrl + utils.queryParams(props);
  }
});
