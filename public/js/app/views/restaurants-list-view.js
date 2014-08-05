/**
 * Handles various `restaurant list` search options. This
 * view will listen to sub-views for order params, filters,
 * and sorting options.
 */

define(function(require, exports, module) {
  var utils = require('utils');
  var Backbone = require('backbone');

  return module.exports = Backbone.View.extend({
    initialize: function() {
      analytics.page('Restaurants List');
      this.listenTo(this.options.paramsView, 'params:submit', this.search);
      this.listenTo(this.options.filtersView, 'filters:change', this.search);
      this.listenTo(this.options.sortView, 'sort:change', this.search);
    }

  , search: function() {
      var props = _.extend(
        {}
      , this.options.filtersView.getProps()
      , this.options.paramsView.getProps()
      , this.options.sortView.getProps()
      );
      // Clone props because analytics is mutating the date property
      analytics.track( 'Restaurant Search', {searchParams: _.clone(props)} );
      var searchUrl = this.options.searchUrl;
      window.location.href = searchUrl + utils.queryParams(props);
    }
  });
});
