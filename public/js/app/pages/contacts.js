define( function( require ){
  var utils = require('utils');

  var ContactView = require('app/views/restaurant/contact-view');

  var page = {
    init: function(options) {
      var contacts        = options.contacts;
      var restaurantId    = options.restaurantId;

      utils.each(contacts, function(contact) {
        // attach contactview
        var view = new ContactView({
          el: '#contact-'+contact.id
        , restaurantId: restaurantId
        , contactId: contact.id
        });
      });

      var createContactView = new ContactView({
        el: '#create-contact'
      , restaurantId: restaurantId
      });
    }
  };

  return page;
});
