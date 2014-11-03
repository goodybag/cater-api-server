/**
 * Handles changes to order amenities like adding
 * plates, napkins, utensils and updating total summary.
 */

define(function(require, exports, module) {
  var Backbone = require('backbone');
  var utils = require('utils');

  return module.exports = Backbone.View.extend({
    events: {
      'change .checkbox': 'onAmenityToggle'
    },

    initialize: function() {
    },

    updateSummary: function(e){
      var $el = $(e.target);
      var checked = $el.is(':checked');
      var price = (checked ? 1 : -1 ) * parseInt($el.val());

      // 1. Update order items
      this.options.orderView.$el
      .find('.order-table [data-amenity-id="' + this.model.id + '"]')
      .toggleClass('hide');

      // 2. Update totals
      this.options.order.set({
        total: this.options.order.get('total') + price
      , sub_total: this.options.order.get('sub_total') + price
      });

      return this;
    },

    update: function (e) {
      // crappy placeholder
      var $el = $(e.target);
      var amenityId = $el.attr('data-amenity-id');
      var orderId = this.options.order.id;
      var add = $el.is(':checked');
      if ( add ) {
        var url = '/api/orders/' + orderId + '/amenities';
        $.ajax({
          type: 'POST'
        , url: url
        , data: { amenity_id: this.model.id, order_id: orderId }
        , success: function() {
            console.log('insert success');
          }
        , error: function() {
            console.log('insert error');
          }
        });
      } else {
        var url = '/api/orders/' + orderId + '/amenities/' + this.model.id;
        $.ajax({
          type: 'DELETE'
        , url: url
        , success: function() {
            console.log('remove success');
          }
        , error: function() {
            console.log('remove error');
          }
        });
      }
      return this;
    },

    onAmenityToggle: function (e){
      return this
        .updateSummary(e)
        .update(e);
    }
  });
});
