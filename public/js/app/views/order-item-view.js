define(function(require, exports, module) {
  var FormView = require('form-view');

  module.exports = FormView.extend({
    model: OrderItem,

    events: {
      'click .remove-order-item-btn': 'onDelete',
      'keyup .form-control': 'autoSave',
      'change .form-control': 'autoSave'
    },

    initialize: function(options) {
      if (this.model)
        this.listenTo(this.model, {
          'change:sub_total': this.onPriceChange,
          'destroy': this.remove,
          'invalid': _.bind(this.trigger, this, 'disableCheckout')
        }, this);

      // In case we save but there's nothing to change, re-enable checkout
      this.on('save:noop', _.bind(this.trigger, this, 'enableCheckout'));
    },

    onPriceChange: function(e) {
      if (this.model.get('sub_total'))
        this.$el.find('.line-item-price').text((this.model.get('sub_total') / 100).toFixed(2));
    },

    fieldMap: {
      quantity: '.order-item-quantity',
      notes: '.order-item-notes',
      recipient: '.order-item-recipient'
    },

    fieldGetters: {
      quantity: _.partial(FormView.intGetter, 'quantity')
    },

    onDelete: function(e) {
      this.model.destroy();
    },

    remove: function(e) {
      this.trigger('remove', this);
      FormView.prototype.remove.apply(this, arguments);
    },

    autoSave: _.debounce(FormView.prototype.onSave, 600)
  });
});