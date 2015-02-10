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
      this.options.filters = this.options.filters || [];
      this.options.filters.forEach(this.listenToFilter.bind(this));
    }

  , addFilter: function(filterView) {
      this.options.filters.push(filterView);
      this.listenToFilter(filterView);
    }

  , listenToFilter: function(filterView) {
      this.listenTo( filterView, filterView.options.changeEvent, this.search );
    }

  , search: function() {
      var props = this.options.filters.reduce(function(memo, filterView) {
        return _.extend(memo, filterView.getProps());
      }, {});

      // Clone props because analytics is mutating the date property
      analytics.track( 'Restaurant Search', {searchParams: _.clone(props)} );
      var searchUrl = this.options.searchUrl;
      window.location.href = searchUrl + utils.queryParams(props);
    }
  });
});
