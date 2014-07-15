define(function(require, exports, module) {
  var utils = require('utils');
  var EditRestaurantView = require('./edit-restaurant-view');
  var Handlebars = require('handlebars');

  return module.exports = EditRestaurantView.extend({
    events: function() {
      return _.extend({}, EditRestaurantView.prototype.events, {
        
      });
    },

    fieldMap: {
      gb_fee:                 '[name="gb_fee"]'
    , is_fee_on_total:        '[name="is_fee_on_total"]'
    , is_direct_deposit:      '[name="is_direct_deposit"]'
    , billing_street:         '[name="billing_street"]'
    , billing_street2:        '[name="billing_street2"]'
    , billing_city:           '[name="billing_city"]'
    , billing_state:          '[name="billing_state"]'
    , billing_zip:            '[name="billing_zip"]'
    },

    fieldGetters: _.extend({
      
    }, EditRestaurantView.prototype.fieldGetters ),

    initialize: function() {
    }
  });
});
