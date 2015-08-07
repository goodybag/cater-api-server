define(function(require, exports, module) {
  var React = require('react');
  var HoursDropDownList = require('../../../dist/restaurant-signup/components/hours-dropdown-list');

  describe('HoursDropDownList Component', function () {

    it('.val() should return correct value', function () {
      var hoursList = React.createElement(HoursDropDownList, null);
      var component = React.render(hoursList, document.createElement('div'));

      expect(component.val()).toEqual([{ day: null, from: null, to: null }]);
    });
  });
});
