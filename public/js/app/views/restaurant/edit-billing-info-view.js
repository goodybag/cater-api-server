define(function(require, exports, module) {
  var utils = require('utils');
  var EditRestaurantView = require('./edit-restaurant-view');
  var Handlebars = require('handlebars');

  return module.exports = EditRestaurantView.extend({
    events: function() {
      return _.extend({}, EditRestaurantView.prototype.events, {

      });
    },

    nullOnEmptyString: [
      'billing_street'
    , 'billing_street2'
    , 'billing_city'
    , 'billing_state'
    , 'billing_zip'
    ],

    fieldMap: {
      no_contract_fee:        '[name="no_contract_fee"]'
    , gb_fee:                 '[name="gb_fee"]'
    , is_fee_on_total:        '[name="is_fee_on_total"]'
    , is_direct_deposit:      '[name="is_direct_deposit"]'
    , billing_street:         '[name="billing_street"]'
    , billing_street2:        '[name="billing_street2"]'
    , billing_city:           '[name="billing_city"]'
    , billing_state:          '[name="billing_state"]'
    , billing_zip:            '[name="billing_zip"]'
    , pms_contact_id:         '[name="pms_contact_id"]'
    , plan_id:                '[name="plan_id"]'
    },

    fieldGetters: _.extend({

    }, EditRestaurantView.prototype.fieldGetters ),

    initialize: function() {
    }
  });
});
