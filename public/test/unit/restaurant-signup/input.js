define(function(require, exports, module) {
  var React = require('react');
  var Input = require('../../../dist/restaurant-signup/components/input.js');

  describe('Input Component', function () {

    it('.val() should return correct value', function () {
      var input = React.createElement(Input, { value: 'foo' });
      var component = React.render(input, document.createElement('div'));

      expect(component.val()).toEqual('foo');
    })

    it('should set errorMessage', function () {
      var props = {
        errorMessage: 'please enter foobar'
      };

      var input = React.createElement(Input, props);
      var component = React.render(input, document.createElement('div'));
      var errorText = component.getDOMNode()
        .querySelectorAll('.error')[0].innerText;

      expect(errorText).toEqual(props.errorMessage);
    });

    it('should set input type', function () {
      var props = {
        type: 'email'
      };

      var input = React.createElement(Input, props);
      var component = React.render(input, document.createElement('div'));
      var renderedInput = component.getDOMNode()
        .querySelectorAll('input')[0];

      expect(renderedInput.type).toEqual(props.type);
    });

    it('should set label', function () {
      var props = {
        label: 'foobar'
      };

      var input = React.createElement(Input, props);
      var component = React.render(input, document.createElement('div'));
      var renderedLabel = component.getDOMNode()
        .querySelectorAll('label')[0];

      expect(renderedLabel.innerText).toEqual(props.label);
    });

  });
});