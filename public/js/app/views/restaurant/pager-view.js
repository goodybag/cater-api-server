/**
* This view handles paging the restaurant listing
*/
define(function(require, exports, module) {
  var Backbone = require('backbone');
  var $ = require('jquery');
  var utils = require('utils');

  return module.exports = Backbone.View.extend({
    events: function () {
      var changeEvent = 'change ' + this.options.inputSelector || '.pager';
      var events = {};
      events[changeEvent] = 'onPagerChange';
      return events;
    }

    , initialize: function() {
      this.options.changeEvent = this.options.changeEvent || 'pagination:change';
    }

    , onPagerChange: function(e) {
      analytics.track('Filter Change', { type: 'Pagination' });
      this.trigger(this.options.changeEvent);
    }

    , getProps: function() {
      return { p:  this.$el.find(this.options.inputSelector || '.pager').val() };
    }

  });
});
