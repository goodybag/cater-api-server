define(function (require, exports, module) {
  var utils = require('utils');
  var ToggleView = require('./toggle-view');

  return ToggleView.extend({
    onSuccess: function (model, response, options) {
      this.$el.find('.is-hidden-icon').toggleClass('hide');
    }
  });
});

