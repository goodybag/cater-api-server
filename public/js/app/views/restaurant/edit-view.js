
define(function(require, exports, module) {
  var utils = require('utils');
  var FormView = require('../form-view');
  return module.exports = FormView.extend({

    events: {
      'click .btn-create-event': 'createEvent'
    },

    initialize: function() {
      
    }
  });
});