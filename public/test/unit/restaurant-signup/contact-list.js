define(function(require, exports, module) {
  var React = require('react');
  var ContactList = require('../../../dist/restaurant-signup/components/contact-list');

  describe('ContactList Component', function () {

    it('.val() should return correct value', function () {
      var contactList = React.createElement(ContactList, null);
      var component = React.render(contactList, document.createElement('div'));

      var list = [{ name: '', position: '', number: '', email: '' }];

      expect(component.val()).toEqual(list);
    });

  });
});
