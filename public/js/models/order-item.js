var OrderItem = Backbone.Model.extend({
  url: function() { return '/orders/' + this.get('order_id') + '/items/' + this.id; },

  initialize: function(attrs, options) {
    this.on('change:price change:quantity', function() {
      this.set('sub_total', this.get('price') * this.get('quantity'));
    }, this);
  }
});
