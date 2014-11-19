define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var Backbone = require('backbone');

  var LeadTimeCounterView = module.exports = Backbone.View.extend({
    initialize: function() {
      if ( this.options.show ) this.showHeader();
      this.time = moment.duration(this.options.time || 0, 'minutes'); // minutes
      this.deadline = moment(this.options.deadline);
      this.interval = this.options.interval || 1000; // defaulte 1 min
      this.template = this.options.template;
      this.context = this.options.context;
      this.tick();
    },

    setTime: function(time) {
      this.time = moment.duration(time || 0, 'minutes');
    },

    tick: function() {
      console.log('tick');
      this.render();
      this.time.subtract(1, 'second');
      setTimeout(this.tick.bind(this), this.interval);
    },

    showHeader: function() {
      this.$el.closest('.sticky-header').addClass('in');
    },

    fromNow: function() {
      // if ( this.time <= 0 ){
      //   return 'Time\'s up!';
      // }
      var days = this.time.days();
      var hrs = this.time.hours();
      var mins = this.time.hours();
      var secs = this.time.seconds();

      if ( days ){
        return 'Must order by: ' + this.deadline.format('MMM Do YYYY');
      } else if ( hrs ){
        return 'Time remaining to submit order: ' + hrs + ' hours';
      } else {
        return 'Time remaining to submit order: ' + mins + ' minutes ' + secs + ' seconds';
      }
    },

    render: function() {
      // var html = Handlebars.partials[this.template].render(this.context);
      // this.$el.html(html);
      this.$el.html(this.fromNow());
    }
  });
  return LeadTimeCounterView;
});
