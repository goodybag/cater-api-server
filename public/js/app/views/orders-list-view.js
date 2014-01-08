define(function(require, exports, module) {
  var Backbone = require('backbone');
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
    }
  });
});