define(function(require, exports, module) {
  var React = require('react');
  var Contact = require('../../../dist/restaurant-signup/components/contact.js');
  describe('Contact Component', function () {

    it('.val() should return contact', function () {
      var contact = React.createElement(Contact, null);
      var component = React.render(contact, document.createElement('div'));

      var expected = {
        name: ''
      , position: ''
      , number: ''
      , email: ''
      };

      expect(component.val()).toEqual(expected);
    });

/*
    it('should update if input updates', function () {
      var contact = React.createElement(Contact, null);
      var component = React.render(contact, document.createElement('div'));

      var inputName = component.getDOMNode()
        .querySelectorAll('input[name="name"]')[0]

      var evt = new Event('change', { bubbles: true });
      inputName.dispatchEvent(evt);

      console.log(component.val())
      expect(component.val()).toEqual(false);
    });
*/

  });
});