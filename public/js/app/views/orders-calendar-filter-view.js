/**
 * Orders Calendar Filter View
 */

define(function(require, exports, module) {

  var $ = require('jquery');
  var utils = require('utils');

  return module.exports = Backbone.View.extend({

    events: {
      'click .checkbox': 'filtersOnClick'
    },

    filterOnClick: function(e) {
      var $statuses = this.$el.find('input[type="checkbox"]:checked');
      var statuses = utils.pluck($statuses, 'value');
      this.options.calendarView.setFilters(statuses);
    }

  });
});
