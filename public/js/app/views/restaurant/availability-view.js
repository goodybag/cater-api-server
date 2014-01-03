/**
 * Dependencies:
 */

define(function(require, exports, module) {
  var utils = require('utils');
  var $ = require('jquery');
  var Backbone = require('backbone');
  var FullCalendar = require('fullcalendar');

  return module.exports = Backbone.View.extend({
    initialize: function() {
      this.$el.find('#calendar').fullCalendar({
        
      });
    }
  });
});