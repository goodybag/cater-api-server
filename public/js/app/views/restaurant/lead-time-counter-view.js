define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var Backbone = require('backbone');

  var LeadTimeCounterView = module.exports = Backbone.View.extend({
    initialize: function() {
      this.time = moment.duration(this.options.time || 0, 'minutes'); // minutes
      this.deadline = moment(this.options.deadline);
      this.interval = this.options.interval || 1000; // defaulte 1 min
      this.tick();
    },

    setTime: function(time) {
      this.time = moment.duration(time || 0, 'minutes');
    },

    tick: function() {
      this.render();
      this.time.subtract(1, 'second');
      setTimeout(this.tick.bind(this), this.interval);
    },

    showHeader: function() {
      this.$el.closest('.sticky-header').addClass('in');
    },

    fromNow: function() {
      var days = this.time.days();
      var hrs = this.time.hours();
      var mins = this.time.minutes();
      var secs = this.time.seconds();
      var pastDue = this.time.asMinutes() <= 0;

      if (pastDue) {
        return 'Time\'s up!';
      } else if ( days ){
        return 'Must order by: ' + this.deadline.format('MMM Do YYYY');
      } else if ( hrs ){
        return 'Time remaining to submit order: ' + hrs + ' hours';
      } else {
        return 'Time remaining to submit order: ' + mins + ' minutes ' + secs + ' seconds';
      }
    },

    render: function() {
      this.$el.html(this.fromNow());
    }
  });
  return LeadTimeCounterView;
});
