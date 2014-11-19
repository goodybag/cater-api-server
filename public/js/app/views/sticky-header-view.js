// So sticky..
define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var $ = require('jquery');

  var StickyHeaderView = module.exports = utils.View.extend({
    initialize: function() {
      this.$page = $('.page');
      utils.defaults(this.options, {
        scrollYTrigger: 50
      });

      $(window).bind('scroll', this.onScroll.bind(this));
      this.model.once('change:id', this.show, this);
    },

    onScroll: function(e) {
      if ( !this.model.id ) return;

      if ($(window).scrollTop() > this.options.scrollYTrigger) {
          this.$el.addClass('stuck');
          // also push page container down
          this.$page.css('margin-top', this.options.scrollYTrigger+'px');
      } else {
          this.$el.removeClass('stuck');
          this.$page.css('margin-top', '0');
      }
    },

    setOrder: function(order) {
      this.options.order = order;
      return this;
    },

    show: function(){
      this.render().$el.addClass('in');
      return this;
    },

    hide: function(){
      this.$el.removeClass('in');
      return this;
    },

    render: function() {
      this.$el.find('#order-id-container').html('Order #' + this.model.id);
      return this;
    }
  });

  return StickyHeaderView;
});
