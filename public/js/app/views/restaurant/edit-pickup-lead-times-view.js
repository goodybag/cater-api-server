define(function(require, exports, module) {
  var utils = require('utils');
  var EditLeadTimesView = require('./edit-lead-times-view');
  var Handlebars = require('handlebars');

  return module.exports = EditLeadTimesView.extend({
    fieldMap: {
      hours_of_operation: '.time'
    , pickup_lead_times: '.lead-times'
    },

    initialize: function() {
      this.fieldGetters.hours_of_operation = this.fieldGetters.delivery_times;
      this.fieldGetters.pickup_lead_times = this.fieldGetters.lead_times;
    }
  });
});
