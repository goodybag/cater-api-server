define(function(require, exports, module) {
  var FormView = require('./form-view');

  var OrderItem = require('../models/order-item');

  return module.exports = FormView.extend({
    model: OrderItem,

    readTemplate: Handlebars.partials.order_item,

    editTemplate: Handlebars.partials.edit_order_item,

    events: {
      'click .remove-order-item-btn': 'onDelete'
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

    render: function(template) {
      if (!template) template = this.options.order.edit ? this.editTemplate : this.readTemplate;
      this.$el.html(template(this.model.toJSON()));
      return this;
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

    autoSave: _.debounce(FormView.prototype.onSave, 600),

    toggleEdit: function(state) {
      if (state == null) state = this.options.order.edit;
      this.render(state ? this.editTemplate : this.readTemplate);
    }
  });
});
