define(function(require){
  var utils = require('utils');

  return utils.View.extend({
    initialize: function() {
      var this_ = this;
      // Enable sub components
      $('[data-role="popover"]').gb_popover();
    },
  });
});
