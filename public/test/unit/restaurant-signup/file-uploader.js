define(function(require, exports, module) {
  var React = require('react');
  var FileUploader = require('../../../dist/restaurant-signup/components/file-uploader.js');

  describe('File Uploader Component', function () {

    it('should exists', function () {
      var uploader = React.createElement(FileUploader, null);
      var component = React.render(uploader, document.createElement('div'));

      console.log(component)
      expect(component).not.toBeNull();
    });

  });
});