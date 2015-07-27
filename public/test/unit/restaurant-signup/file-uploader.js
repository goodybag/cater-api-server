define(function(require, exports, module) {
  var React = require('react');
  var FileUploader = require('../../../dist/restaurant-signup/components/file-uploader.js');

  describe('File Uploader Component', function () {

    it('.val() should return correct value', function () {
      var props = { value: 'foo' };
      var uploader = React.createElement(FileUploader, props);
      var component = React.render(uploader, document.createElement('div'));

      expect(component.val()).toEqual(props.value);
    });

    it('should set errorMessage', function () {
      var props = {
        errorMessage: 'please enter foobar'
      };

      var uploader = React.createElement(FileUploader, props);
      var component = React.render(uploader, document.createElement('div'));
      var errorText = component.getDOMNode()
        .querySelectorAll('.error')[0].innerText;

      expect(errorText).toEqual(props.errorMessage);
    });

    it('should set label', function () {
      var props = {
        label: 'foobar'
      };

      var uploader = React.createElement(FileUploader, props);
      var component = React.render(uploader, document.createElement('div'));

      // grab the first label from the render method
      var renderedLabel = component.getDOMNode()
        .querySelectorAll('label')[0];

      expect(renderedLabel.innerText).toEqual(props.label);
    });


  });
});