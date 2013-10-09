var AddressView = Backbone.View.extend({
  events: {
    'click .address-remove':      'removeAddress'
  , 'click .address-default':     'setDefaultAddress'
  , 'submit .address-edit':       'updateAddress'
  },

  initialize: function() {
    // Cache elements
    this.$submitBtn = this.$el.find('.address-submit').button();
  },

  removeAddress: function(e) {
    var id = $(e.target).data('id');
    var address = this.collection.get(id);
    address.destroy({
      success: function(model, response) {
        location.reload();
      },
      error: function(model, xhr, options) { 
        console.error('Unable to remove address');
      }
    });
  },

  setDefaultAddress: function(e) {
    var id = $(e.target).data('id');
    var address = this.collection.get(id);
    address.save({is_default: true}, {
      success: function(model, response, options) {
        location.reload();
      },
      error: function(model, xhr, options) {
        console.error('Unable to set a default address');
      }
    });
  },

  updateAddress: function(e) {
    e.preventDefault();
    var this_ = this;
    var updates = {
      street: this.$el.find('.address-street').val()
    , city:   this.$el.find('.address-city').val()
    , state:  this.$el.find('.address-state').val()
    , zip:    this.$el.find('.address-zip').val()
    };

    this.model.save(updates, {
      patch: true,

      success: function(model, response, options) {
        this_.$submitBtn.button('loading');
        setTimeout(function() { this_.$submitBtn.button('reset'); }, 2000);
      },
      error: function(model, xhr, options) {
        console.error('Unable to update address');
      }
    });
  }
});
