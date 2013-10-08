var ItemModal = Backbone.View.extend({
  events: {
    'submit .modal-item-form': 'submit'
  , 'click .btn-item-remove':  'onItemRemoveClick'
  },

  render: function() {
    var inOrder = this.model instanceof OrderItem;

    this.$el.find('.modal-title').html(this.model.get('name'));
    this.$el.find('.item-description').text(this.model.get('description') || '');
    var quantity = inOrder ? this.model.get('quantity') : 1;
    this.$el.find('.item-quantity').val(quantity);

    this.$el.find('.item-legend-detail-feeds').text(
      Handlebars.helpers.range(this.model.get('feeds_min'), this.model.get('feeds_max'))
    );

    this.$el.find('.item-legend-detail-price').html(
      helpers.dollars( this.model.get('price') )
    );

    this.$el.find('.btn-item-remove').toggle(inOrder)

    var submitBtnText = inOrder ? 'Update Item' : 'Add To Order';
    this.$el.find('.btn.item-modal-submit').text(submitBtnText);

    this.$el.find('.form-group-item-notes textarea').val( this.model.get('notes') );

    this.$el.find('.item-options').html(
      // If we have options, render the partial, otherwise clear the item-options div
      (this.model.attributes.options_sets || 0).length
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
    var this_ = this;
    var orderItem = this.model instanceof OrderItem ? this.model : null;

    var data = {
      quantity:     parseInt( this.$el.find('.item-quantity').val() ),
      notes:        this.$el.find('.form-group-item-notes textarea').val(),
      options_sets: _.clone( this.model.get('options_sets') )
    };

    this.clearErrors();

    // Get checkbox/radio option states
    _( data.options_sets ).each( function( set ){
      _( set.options ).each( function( option ){
        var $el = this_.$el.find( '#item-option-' + option.id );
        delete option.default_state;
        option.state = $el.prop('checked');
      });
    });

    if (data.quantity <= 0) {
      if (orderItem) orderItem.destroy();
    } else {
      if (orderItem){
        // Options_sets is not triggering changed, so trigger it when other things wont
        if ( data.quantity === orderItem.get('quantity') && data.notes === orderItem.get('notes') ){
          orderItem.trigger('change:options_sets');
        }

        orderItem.save(data, {wait: true});
      }
      else {
        orderItem = this.options.orderItems.create(
          _.extend( { item_id: this.model.attributes.id }, data ),
          { wait: true }
        );
      }
    }

    if ( !orderItem || !orderItem.validationError ) return this.hide();

    this.displayErrors( orderItem.validationError );
  },

  displayErrors: function( errors ){
    var this_       = this;
    var $errors     = this.$el.find('.errors');
    var $errorTmpl  = $errors.find('.alert-generic');

    _( errors ).forEach( function( error ){
      var $error = $errorTmpl.clone().html( error.message ).removeClass('hide');

      if ( error.type = 'OPTIONS_SET_REQUIRED' ){
        $error.addClass('error-options-set-required');
        this_.$el.find('[data-options-set-id="' + error.optionSetId + '"]').before( $error );
      } else {
        $errors.append( $error );
      }
    });

    return this;
  },

  clearErrors: function(){
    this.$el.find('.errors > .alert').addClass('hide');
    return this;
  },

  onItemRemoveClick: function(e) {
    e.preventDefault();

    if ( this.model instanceof OrderItem ){
      this.model.destroy();
    }

    this.hide();
  }
});
