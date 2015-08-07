define(function(require, exports, module) {
  var React = require('react');
  var CheckboxList = require('../../../dist/restaurant-signup/components/checkbox-list');

  describe('CheckboxList Component', function () {

    it('.val() should return correct value', function () {
      var props = {
        checkBoxes: []
      };

      var checkboxList = React.createElement(CheckboxList, props);
      var component = React.render(checkboxList, document.createElement('div'));

      expect(component.val()).toEqual([]);
    });

  });
});
