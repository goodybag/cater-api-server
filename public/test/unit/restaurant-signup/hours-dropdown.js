define(function(require, exports, module) {
  var React = require('react');
  var HoursDropDown = require('../../../dist/restaurant-signup/components/hours-dropdown');

  describe('HoursDropDown Component', function () {

    it('.val() should return correct value', function () {
      var hours = React.createElement(HoursDropDown, null);
      var component = React.render(hours, document.createElement('div'));

      expect(component.val()).toEqual({ day: null, from: null, to: null });
    });

  });
});
