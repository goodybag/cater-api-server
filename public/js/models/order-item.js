var OrderItem = Backbone.Model.extend({
  defaults: {
    selectedOptions: [
      { name: 'Rye Bun',    price: 50 },
      { name: 'Lettuce',    price: 0 },
      { name: 'Tomato',     price: 0 },
      { name: 'Onion',      price: 0 }
    ]
  },

  initialize: function(attrs, options) {
    this.on('change:price change:quantity', function() {
      this.set('sub_total', this.get('price') * this.get('quantity'));
    }, this);
    console.log("initing", attrs, this.attributes)
  }
});
