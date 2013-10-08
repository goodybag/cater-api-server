var AddressView = Backbone.View.extend({
  events: {
    'click .address-remove':      'removeAddress'
  , 'click .address-default':     'setDefaultAddress'
  },

  removeAddress: function(e) {
    var id = $(e.target).data('id');
    $.ajax({
      url: '/users/me/addresses/' + id
    , type: 'DELETE'
    , contentType: 'application/json'
    , error: function(jqXHR, textStatus, errorThrown) {
        console.error('Error removing address', errorThrown);
      }
    , success: function(data, textStatus, jqXHR) {
        location.reload();
      }
    });
  },

  setDefaultAddress: function(e) {
    var id = $(e.target).data('id');
    $.ajax({
      url: '/users/me/addresses/' + id
    , type: 'POST'
    , data: JSON.stringify({ _method: 'PUT', is_default: true })
    , contentType: 'application/json'
    , error: function(jqXHR, textStatus, errorThrown) {
        console.error('Error setting default address', errorThrown);
      }
    , success: function(data, textStatus, jqXHR) {
        location.reload();
      }
    });
  }
});
