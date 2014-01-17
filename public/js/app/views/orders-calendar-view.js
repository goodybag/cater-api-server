/**
 * Orders Calendar View
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
      'click .btn-create-event': 'createEvent'
    , 'click .btn-remove-event': 'removeEvent'
    , 'click .btn-update-event': 'updateEvent'
    },

    initialize: function() {
      this.setupCalendar();
    },

    setupCalendar: function() {
      this.$el.fullCalendar({
        events: orders.getFullCalendarEvents()
      , eventClick:     this.viewOrder.bind(this)
      });
    },

    viewOrder: function(calEvent, jsEvent, view) {
      window.location.href = '/orders/' + calEvent.orderId;
    }
  });
});
