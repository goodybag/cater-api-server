define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var Backbone = require('backbone');
  // var Amenity = require('app/models/amenity');

  var LeadTimeCounterView = module.exports = Backbone.View.extend({
    initialize: function() {
      this.time = this.options.time || 0; // minutes
      this.interval = this.options.interval || 1000 * 60; // defaulte 1 min
      this.template = this.options.template;
      this.context = this.options.context;
      this.tick();
    },

    tick: function() {
      this.render();
      this.time--;
      if ( this.time >= 0)
        setTimeout(this.tick.bind(this), this.interval);
    },

    fromNow: function() {
      if ( this.time <= 0 ){
        return 'Time\'s up!';
      }

      return moment()
              .add(this.time, 'minutes')
              .fromNow(true);
    },

    render: function() {
      // var html = Handlebars.partials[this.template].render(this.context);
      // this.$el.html(html);
      this.$el.html('Order must be placed in ' + this.fromNow());
    }
  });
  return LeadTimeCounterView;
});
