/**
 * This view handles sorting the restaurant listing
 */
define(function(require, exports, module) {
  var Backbone = require('backbone');
  var $ = require('jquery');
  var utils = require('utils');

  return module.exports = Backbone.View.extend({
    events: function () {
      var changeEvent = 'change ' + this.options.inputSelector || '.sort';
      var events = {};
      events[changeEvent] = 'onSortChange';
      return events;
    }

  , initialize: function() {
      this.options.changeEvent = this.options.changeEvent || 'sort:change';
    }

  , onSortChange: function(e) {
      analytics.track('Filter Change', { type: 'Sorting' });
      this.trigger(this.options.changeEvent);
    }

  , getProps: function() {
      return { sort:  this.$el.find(this.options.inputSelector || '.sort').val() };
    }

  });
});
