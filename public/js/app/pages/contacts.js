define( function( require ){
  var utils = require('utils');

  var Views = {
    ContactView:       require('app/views/restaurant/contact-view')
  };

  var page = {
    init: function(options) {
      var contacts  = options.contacts;

      // var view = new Views.CheckoutView({
      //   el: '#main',
      //   model: order,
      //   user: user
      // });

      utils.each(contacts, function(contact) {
        // attach contactview
        var view = new Views.ContactView({
          el: '#contact-'+contact.id
        });
      });

      var createContactView = new Views.ContactView({
        el: '#create-contact'
      })
    }
  };

  return page;
});
