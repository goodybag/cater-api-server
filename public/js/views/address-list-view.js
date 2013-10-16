var AddressListView = FormView.extend({
  events: {
    'click .address-remove':      'removeAddress'
  , 'click .address-default':     'setDefaultAddress'
  , 'submit .address-edit':       'onSave'
  },

  initialize: function() {
    var this_ = this;

    // Cache elements
    this.$submitBtn = this.$el.find('.address-submit').button();

    this.on('save:success', function() {
      location.reload();
    });

    this.on('save:error', function() {
      this.$submitBtn.button('error');
      setTimeout(function() { this_.$submitBtn.button('reset'); }, 2000);
    });
  },

  fieldMap: {
    name:     '.address-edit .address-name'
  , street:   '.address-edit .address-street'
  , street2:  '.address-edit .address-street2'
  , city:     '.address-edit .address-city'
  , state:    '.address-edit .address-state'
  , zip:      '.address-edit .address-zip'
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
  }
});
