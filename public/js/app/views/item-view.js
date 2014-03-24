define(function(require, exports, module) {
  var Backbone = require('backbone');
console.log('wuuuuuuuuuuuuuuut');
  return module.exports = Backbone.View.extend({
    events: {
      'click': 'showModal'
    },

    showModal: function(e) {
      console.log('showModal');
      e.preventDefault();
      this.options.itemModalView.provideModel(this.model).show();
      this.$el.addClass('in');
    }
  });
});