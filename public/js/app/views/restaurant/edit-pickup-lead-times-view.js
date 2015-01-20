define(function(require, exports, module) {
  var utils = require('utils');
  var EditLeadTimesView = require('./edit-lead-times-view');
  var Handlebars = require('handlebars');

  return module.exports = EditLeadTimesView.extend({
    fieldMap: {
      hours_of_operation:                       '.time'
    , pickup_lead_times:                        '.lead-times'
    , disable_courier:                          '.disable-courier'
    , disable_courier_notifications:            '#input-disable-courier-notifications'
    , delivery_service_head_count_threshold:    '[name="delivery_service_head_count_threshold"]'
    , delivery_service_order_amount_threshold:  '[name="delivery_service_order_amount_threshold"]'
    },

    fieldGetters: _.extend({
      disable_courier: function() {
        return this.$el.find(this.fieldMap.disable_courier).is(':checked');
      }
    }, EditLeadTimesView.prototype.fieldGetters ),

    initialize: function() {
      this.fieldGetters.hours_of_operation = this.fieldGetters.delivery_times;
      this.fieldGetters.pickup_lead_times = this.fieldGetters.lead_times;
    }
  });
});
