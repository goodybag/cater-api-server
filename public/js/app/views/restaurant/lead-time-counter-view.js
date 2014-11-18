define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var Backbone = require('backbone');
  // var Amenity = require('app/models/amenity');

  var LeadTimeCounterView = module.exports = Backbone.View.extend({
    initialize: function() {
      this.time = moment.duration(this.options.time || 0, 'minutes'); // minutes
      this.interval = this.options.interval || 1000; // defaulte 1 min
      this.template = this.options.template;
      this.context = this.options.context;
      this.tick();
    },

    tick: function() {
      this.render();
      this.time.subtract(1, 'second');
      setTimeout(this.tick.bind(this), this.interval);
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
        return days + ' days';
      } else if ( hrs ){
        return hrs + ' hours';
      } else {
        return mins + ' minutes ' + secs + ' seconds';
      }
    },

    render: function() {
      // var html = Handlebars.partials[this.template].render(this.context);
      // this.$el.html(html);
      this.$el.html('Time remaining to submit order: ' + this.fromNow());
    }
  });
  return LeadTimeCounterView;
});
