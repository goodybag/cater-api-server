define(function(require) {
  var $ = require('jquery');
  describe('popover', function() {
    beforeAll(function(done) {
      require(['jquery.popover'], function() {
        $.fn._popover = $.fn.gb_popover.noConflict();
        done();
      });
    });

    it('should be defined on jquery object', function() {
      expect($(document.body)._popover).toBeDefined();
    });

    it('should support noConflict', function(done) {
      // verify from setup
      expect($(document.body).gb_popover).toBeUndefined();
      done();
    });

    it('should attach data', function() {
      expect($('<div></div>')._popover().data('gb.popover')).toBeDefined();
    });
  });
});
