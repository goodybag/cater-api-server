define(function(require, exports, module) {
  var utils = require('utils');
  var moment = require('moment');

  return module.exports = Backbone.View.extend({
    events: {
    },

    initialize: function() {
      this.convertUtcDates();
    },

    /**
     * Convert backend dates stored in UTC
     * to client's local timezone
     */
    convertUtcDates: function() {
      _.each(this.$el.find('.date-created'), function(date) {
        var $date = $(date);
        var output = moment.utc($date.data('date')).local().format('l h:mm A');
        $date.html(output);
      });
    },

    setFilters: function(statuses) {
      var this_ = this;
      this.$el.find('.list-group-item').hide();
      utils.each(statuses, function(status) {
        this_.$el.find('.list-group-item[data-status="' + status + '"]').show();
      });
    }
  });
});