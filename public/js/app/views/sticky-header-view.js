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
      this.model.once('change:id', this.show, this);
    },

    onScroll: function(e) {
      if ( !this.model.id ) return;

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
