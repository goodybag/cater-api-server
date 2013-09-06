var OrderSummaryView = Backbone.View.extend({
  template: Handlebars.partials.order_summary,

  initialize: function(options) {
    if (this.model) {
      this.listenTo(this.model, {
        'change:sub_total': this.subTotalChange,
        'change:below_min': this.belowMinChange,
        'change:submittable': this.submittableChange
      }, this);
      if (this.model.orderItems) this.listenTo(this.model.orderItems, {
        'add': this.addItem,
        'remove': this.toggleWithItems
      }, this);
    }

    this.$tbody = this.$el.find('.order-table tbody');
  },

  addItem: function(model, collection, options) {
    this.toggleWithItems();

    var subview = new OrderItemSummaryView({
      model:          model
    , itemModalView:  this.options.itemModalView
    });

    this.$tbody.append(subview.render().el);
  },

  toggleWithItems: function() {
    var items = this.model.orderItems.length > 0;
    this.$el.find('.with-items').toggleClass('hide', !items);
    this.$el.find('.without-items').toggleClass('hide', items);
  },

  subTotalChange: function(model, value, options) {
    this.$el.find('.subtotal').text((value / 100).toFixed(2));
  },

  belowMinChange: function(model, value, options) {
    this.$el.find('.minimum-order').toggleClass('hide', !value);
  },

  submittableChange: function(model, value, options) {
    var $btn = this.$el.find('.btn-checkout');
    value ? $btn.removeAttr('disabled') : $btn.attr('disabled', 'disabled');
  }

});
