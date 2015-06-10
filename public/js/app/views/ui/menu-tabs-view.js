define(function(require, exports, module) {
  var $       = require('jquery');
  var _       = require('lodash');
  var utils   = require('utils');

  module.exports = utils.View.extend({
    initialize: function() {
      this.cache();
      this.affix();
      this.scroll();
    },

    events: {
      'click a': 'onTabClick'
    },

    cache: function() {
      this.$window = $(window);
      this.$tabs = this.$el.find('a');
      this.$tabTargets = this.$tabs.map(function() {
        var target = $(this).attr('href');
        var item = $(target);
        if ( item.length ) return item;
      });
      this.tabsHeight = this.$el.outerHeight();
      return this;
    },

    affix: function() {
      this.$el.affix({
        offset: {
          top: this.$el.offset().top
        }
      });
      return this;
    },

    scroll: function() {
      var onScroll = this.onScroll.bind(this)
      var wait = this.options.throttleWait || 200;
      var throttled = _.throttle(onScroll, wait);
      this.$window.scroll( throttled );
      return this;
    },

    onScroll: function() {
      var fromTop = this.$window.scrollTop() + this.tabsHeight;
      var current = this.$tabTargets.map(function() {
        if ( $(this).offset().top < fromTop ) return this;
      }).last();
      var id = current && current.length ? current[0].attr('id') : '';

      if ( this.lastId !== id ){
        this.lastId = id;
        this.$el.find('li')
          .removeClass('active')
          .find('a[href="#' + id + '"]')
          .parent()
          .addClass('active');
      }
    },

    onTabClick: function(e) {
      e.preventDefault();
      var href = $(e.target).attr('href');
      var top = $(href).offset().top;
      var scrollY = top - this.$el.outerHeight() + 1;
      this.scrollTop( scrollY );
    },

    scrollTop: function(top) {
      this.$page = this.$page || $('html, body');
      this.$page
        .stop()
        .animate({ scrollTop: top }, this.options.scrollSpeed || 0);
      return this;
    }
  });

  return module.exports;
});
