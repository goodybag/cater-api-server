var OrderItem = Backbone.Model.extend({
  initialize: function(attrs, options) {
    this.on('change:price change:quantity change:options_sets', function() {
      var total = this.get('price');

      // Add in all selected options
      _(this.get('options_sets')).each( function( set ){
        _(set.options).each( function( option ){
          if ( option.state ) total += option.price;
        })
      });

      this.set('sub_total', total * this.get('quantity'));
    }, this);
  }
});
