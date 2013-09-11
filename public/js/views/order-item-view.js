var OrderItemView = FormView.extend({
  model: OrderItem,

  events: {
    'submit .order-item-form': 'onSave',
    'click .remove-order-item-btn': 'onDelete',
    'keyup .order-item-field': 'onFieldChange',
    'change .order-item-field': 'onFieldChange'
  },

  initialize: function(options) {
    if (this.model)
      this.listenTo(this.model, {
        'change:sub_total': this.onPriceChange,
        'destroy': this.remove
      }, this);
  },

  onPriceChange: function(e) {
    if (this.model.get('sub_total'))
      this.$el.find('.order-item-price').text('$' + (this.model.get('sub_total') / 100).toFixed(2));
  },

  fieldMap: {
    quantity: '.order-item-quantity',
    notes: '.order-item-notes'
  },

  fieldGetters: {
    quantity: _.partial(FormView.intGetter, 'quantity')
  },

  onDelete: function(e) {
    this.model.destroy();
  }
});
