var OrderItemView = Backbone.View.extend({
  model: OrderItem,

  events: {
    'submit .order-item-form': 'onSave',
    'click .remove-order-item-btn': 'onDelete',
    'keyup .order-item-field': 'onFieldChange',
    'change .order-item-field': 'onFieldChange'
  },

  initialize: function(options) {
    if (this.model)
      this.listenTo(this.model, 'change:sub_total', this.onPriceChange, this);
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
    quantity: function() {
      return parseInt(this.$el.find(this.fieldMap.quantity).val());
    }
  },

  getDiff: function() {
    var diff = {};

    for (var key in this.fieldMap) {
      var getter = this.fieldGetters[key];
      var val = getter ? getter.apply(this) : this.$el.find(this.fieldMap[key]).val().trim();
      if ((val || this.model.get(key)) && val != this.model.get(key))
        diff[key] = val;
    }

    return _.size(diff) > 0 ? diff : null;
  },

  onFieldChange: function(e) {
    this.$el.find('.order-item-save-btn').toggleClass('hide', !this.getDiff());
  },

  onSave: function(e) {
    e.preventDefault();
    var diff = this.getDiff();
    if (!diff) return;
    var view = this;
    this.model.save(diff, {
      error: function(jqXHR, textStatus, errorThrown) { alert(errorThrown); },
      success: function(data, textStatus, jqXHR) { view.$el.find('.order-item-save-btn').addClass('hide'); },
      patch: true,
      wait: true
    });
  },

  onDelete: function(e) {
    this.model.destroy({
      success: function(data, textStatus, jqXHR) {
        this.remove();
      }
    });
  }
});
