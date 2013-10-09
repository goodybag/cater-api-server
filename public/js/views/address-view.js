var AddressView = Backbone.View.extend({
  events: {
    'click .address-remove':      'removeAddress'
  , 'click .address-default':     'setDefaultAddress'
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
