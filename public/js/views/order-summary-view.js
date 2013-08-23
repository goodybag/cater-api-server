var OrderSummaryView = Backbone.View.extend({
  initialize: function(options) {
    if (this.model) {
      this.listenTo(this.model, {
        'change:sub_total': this.subTotalChange,
        'change:submittable': this.onSubmittableChange
      }, this);

      if (this.model.orderItems) this.listenTo(this.model.orderItems, {
        'add': this.addItem,
        'remove': this.removeItem
      }, this);
    }
  },

  onSubmittableChange: function(model, value, options) {
    var $btn = this.$el.find('.checkout-btn');
    value ? $btn.removeAttr('disabled') : $btn.attr('disabled', 'disabled');
  },


  addItem: function(model, collection, options) {
    this.$el.find('.no-items').addClass('hide');
    var subview = new OrderItemSummaryView({model: model});
    this.$el.find('.order-items').append(subview.render().el);
  },

  removeItem: function(model, collection, options) {
    if (collection.length === 0)
      this.$el.find('.no-items').removeClass('hide');
  },

  subTotalChange: function(model, value, options) {
    this.$el.find('#subtotal').text((value / 100).toFixed(2));
    this.$el.find('.checkout-btn-row').toggleClass('hide', this.model.get('below_min') || value <= 0);
  }
});
