define(function(require, exports, module) {
  var Backbone = require('backbone');

  return module.exports = Backbone.View.extend({
    events: {
      'click': 'showModal'
    },

    showModal: function() {
      this.options.itemModalView.provideModel(this.model).show();
    }
  });
});