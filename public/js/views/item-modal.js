var ItemModal = Backbone.View.extend({
  events: {
    'submit .modal-item-form': 'submit'
  , 'click .btn-item-remove':  'onItemRemoveClick'
  },

  render: function() {
    var inOrder = this.model instanceof OrderItem;

    this.$el.find('.modal-title').html(this.model.get('name'));
    this.$el.find('.item-description').text(this.model.get('description'));
    var quantity = inOrder ? this.model.get('quantity') : 1;
    this.$el.find('.item-quantity').val(quantity);

    this.$el.find('.item-legend-detail-feeds').html(
      this.model.get('feeds_min') == this.model.get('feeds_max')
        ? this.model.get('feeds_min')
        : ( this.model.get('feeds_min') + '-' + this.model.get('feeds_max') )
    );

    this.$el.find('.item-legend-detail-price').html(
      helpers.dollars( this.model.get('price') )
    );

    this.$el.find('.btn-item-remove').toggle(inOrder)

    var submitBtnText = inOrder ? 'Update Item' : 'Add To Order';
    this.$el.find('.btn.item-modal-submit').text(submitBtnText);

    this.$el.find('.item-options').html(
      // If we have options, render the partial, other clear the item-options div
      (this.model.attributes.options || 0).length
        ? Handlebars.partials.item_options( this.model.toJSON() )
        : ''
    );
  },

  provideModel: function(model) {
    this.stopListening(this.model);
    this.model = model;
    // This is where any model event listeners would go
    this.render();
    return this;
  },

  show: function() {
    this.$el.modal('show');
  },

  hide: function() {
    this.$el.modal('hide');
  },

  submit: function(e) {
    e.preventDefault();
    var quantity = parseInt(this.$el.find('.item-quantity').val());

    var orderItem = this.model instanceof OrderItem ? this.model : this.options.orderItems.findWhere({item_id: this.model.id});

    if (quantity <= 0) {
      if (orderItem) orderItem.destroy();
    } else {
      if (orderItem)
        orderItem.save({quantity: quantity}, {wait: true});
      else
        this.options.orderItems.create({item_id: this.model.attributes.id, quantity: quantity}, {wait: true});
    }

    this.hide();
  },

  onItemRemoveClick: function(e) {
    e.preventDefault();

    if ( this.model instanceof OrderItem ){
      this.model.destroy();
    }

    this.hide();
  }
});
