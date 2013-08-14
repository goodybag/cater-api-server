var OrderItem = Backbone.Model.extend({
  urlRoot: function() { return '/orders/' + this.get('order_id') + '/items/'},

  initialize: function(attrs, options) {
    this.on('change:price change:quantity', function() {
      this.set('sub_total', this.get('price') * this.get('quantity'));
    }, this);
  }
});
