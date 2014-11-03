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
      // Cache a price delta for amenities
      this.delta = 0;
    },

    updateSummary: function(e){
      var $el = $(e.target);
      var amenityId = $el.data('amenity-id');

      // 1. Update order items
      this.options.orderView.$el
      .find('.order-table [data-amenity-id="' + amenityId + '"]')
      .toggleClass('hide');

      // 2. Update totals
      var data = { 
        total: this.model.get('total') + this.delta
      , sub_total: this.model.get('sub_total') + this.delta
      };
      var updatedOrder = _.extend(this.model.toJSON(), data);
      this.options.orderView.$el.find('.totals').html(Handlebars.partials.totals({order: updatedOrder}));

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
      var $el = $(e.target);
      var checked = $el.is(':checked');
      var price = parseInt($el.val());
      this.delta += checked ? price : -price;
      return this
        .updateSummary(e)
        .update(e);
    }
  });
});
