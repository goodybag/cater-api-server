define(function(require, exports, module) {
  var Backbone = require('backbone');

  var template = require('hbs!partials/order-item-summary');

  module.exports = Backbone.View.extend({
    tagName: 'tr',

    className: 'order-item',

    id: function() { return 'order-item-' + this.model.id; },

    template: template,

    events: {
      'click .item-edit': 'openEditModal',
      'click .remove-order-item-btn': 'destroy'
    },

    initialize: function(options) {
      this.listenTo(this.model, {
        'change': this.render,
        'destroy': this.remove
      }, this);
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    },

    openEditModal: function(e) {
      e.preventDefault();
      this.options.itemModalView.provideModel(this.model);
      this.options.itemModalView.show();
    },

    destroy: function() {
      this.model.destroy();
    }
  });
});