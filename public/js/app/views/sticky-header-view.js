// So sticky..
define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var $ = require('jquery');

  var StickyHeaderView = module.exports = utils.View.extend({
    initialize: function() {
      utils.defaults(this.options, {
        scrollYTrigger: 50
      });

      $(window).bind('scroll', this.onScroll.bind(this));
    },

    onScroll: function(e) {
      if ($(window).scrollTop() > this.options.scrollYTrigger) {
          this.$el.addClass('stuck');
      } else {
          this.$el.removeClass('stuck');
      }
    },

    setOrder: function(order) {
      this.options.order = order;
      return this;
    },

    show: function(){
      this.$el.addClass('in');
      return this;
    },

    hide: function(){
      this.$el.removeClass('in');
      return this;
    },

    render: function() {
      var context = { order: this.options.order };
      var html = Handlebars.partials.checkout_sticky_header(context);
      // this.$el.replaceWith(html);
      return this;
    }
  });

  return StickyHeaderView;
});
