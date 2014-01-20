/**
 * Orders Calendar Filter View
 */

define(function(require, exports, module) {

  var $ = require('jquery');
  var utils = require('utils');

  return module.exports = Backbone.View.extend({

    events: {
      'click .btn-filter': 'filterOnClick'
    },

    filterOnClick: function(e) {
      var status = $(e.target).data('status');
      this.options.calendarView.toggleStatus(status);
    }

  });
});
