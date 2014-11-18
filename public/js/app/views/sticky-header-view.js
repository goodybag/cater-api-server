// So sticky..
define(function(require, exports, module) {
  var utils = require('utils');

  var StickyHeaderView = module.exports = utils.View.extend({
    show: function(){
      this.$el.addClass('in');
    },

    hide: function(){
      this.$el.removeClass('in');
    }
  });

  return StickyHeaderView;
});
