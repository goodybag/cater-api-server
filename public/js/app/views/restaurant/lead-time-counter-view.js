define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var Backbone = require('backbone');
  var venter = require('venter');

  var LeadTimeCounterView = module.exports = Backbone.View.extend({
    events: {
      'click .order-params-btn': 'onClickOrderParams'
    },

    initialize: function() {
      this.time = moment.duration(this.options.time || 0, 'minutes'); // minutes
      this.interval = this.options.interval || 1000; // default 1 min

      this.model.on('change:guests', this.updateTime, this);
      this.model.on('change:datetime', this.updateTime, this);

      this.options.asapHrs = this.options.asapHrs || 3; // hours under this also show mins

      this.start();
    },

    onClickOrderParams: function(e) {
      e.preventDefault();
      venter.trigger('open:order-params', e);
    },

    updateTime: function() {
      this.setTime(this.model.restaurant.getTimeLeft(this.model));
    },

    setTime: function(time) {
      this.time = moment.duration(time || 0, 'minutes');
      if ( !this.intervalId ) this.start();
    },

    tick: function() {
      this.render();
      this.time.subtract(1, 'second');
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
        this.stop();
        return Handlebars.partials.lead_time_past_due();
      } else if ( days ){
        var deadline = this.model.restaurant.getDeadline(this.model).format('MMM Do YYYY');
        return 'Must order by: ' + deadline;
      } else if ( hrs ){
        var minsText = hrs <= this.options.asapHrs ? ' ' + mins + ' mins' : '';
        return 'Time remaining to submit order: ' + hrs + ' hours' + minsText;
      } else {
        return 'Time remaining to submit order: ' + mins + ' minutes ' + secs + ' seconds';
      }
    },

    start: function() {
      this.intervalId = setInterval(this.tick.bind(this), this.interval);
      return this;
    },

    stop: function() {
      clearInterval(this.intervalId);
      this.intervalId = null;
      return this;
    },

    render: function() {
      this.$el.html(this.fromNow());
      $('[data-toggle="popover"]').popover();
    }
  });
  return LeadTimeCounterView;
});
