
define(function(require, exports, module) {
  var utils = require('utils');
  var FormView = require('../form-view');
  return module.exports = FormView.extend({

    events: {
      'click .btn-create-event': 'createEvent'
    , 'submit .form-basic-info': 'update'
    },

    initialize: function() {
      
    },

    update: function(e) {
      e.preventDefault();


      // Get form fields
      console.log(utils.pluck($(e.currentTarget).find('input'), 'name'));
      console.log(utils.pluck($(e.currentTarget).find('input'), 'value'));
    }

  });
});