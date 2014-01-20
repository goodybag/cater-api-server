/**
 * Orders Calendar Filter View
 */

define(function(require, exports, module) {

  // Deps
  var $ = require('jquery');
  var moment = require('moment');
  var FullCalendar = require('fullcalendar');

  // Lib
  var utils = require('utils');
  var notify = require('notify');

  // Bootstrapped data
  var orders = require('data/orders');

  // Views

  // Models

  return module.exports = Backbone.View.extend({
    templates: {

    },

    events: {
      'click .btn-filter': 'filterOnClick'
    },

    initialize: function() {
      this.filters = ['pending', 'submitted', 'accepted'];
    },

    filterOnClick: function(e) {
      var status = $(e.target).data('status');
      this.options.calendarView.toggleStatus(status);
    },


  });
});
