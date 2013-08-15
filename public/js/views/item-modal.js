var ItemModal = Backbone.View.extend({
  events: {
    'submit .item-modal-form': 'submit'
  },

  render: function() {
    this.$el.find('.modal-title').html(Handlebars.partials.item_modal_title(this.model.toJSON()));
    this.$el.find('.item-description').text(this.model.get('description'));
    var quantity = this.model instanceof OrderItem ? this.model.get('quantity') : 1;
    this.$el.find('.item-modal-quantity').val(quantity);

    var submitBtnText = this.model instanceof OrderItem ? 'Update Item' : 'Add To Order';
    this.$el.find('.btn.item-modal-submit').text(submitBtnText);
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
    var quantity = parseInt(this.$el.find('.item-modal-quantity').val());

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
  }
});
