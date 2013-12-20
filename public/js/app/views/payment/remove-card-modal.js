define(function(require, exports, module) {
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');

  return module.exports = Backbone.View.extend({
    template: Handlebars.partials.remove_card_modal,

    events: {
      'click .btn-close': 'close'
    },

    render: function() {
      this.$el.html(this.template(this.context));
    },

    /**
     * Replace card text on the modal
     */
    show: function(options) {
      this.context = options;
      this.render();
      this.$el.modal('show');
    },

    close: function() {
      this.$el.modal('close');
    }
  });
});