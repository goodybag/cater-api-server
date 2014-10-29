/**
 * Handles changes to order amenities like adding
 * plates, napkins, utensils and updating total summary.
 */

define(function(require, exports, module) {
  var Backbone = require('backbone');
  var utils = require('utils');
  return module.exports = Backbone.View.extend({
    events: {
      'change .amenity-checkbox': 'onCheckboxChange'
    , 'change .amenity-checkbox': 'onAmenityToggle'
    },

    initialize: function() {
      this.cacheTotal();
    },

    cacheTotal: function() {
      this.amenityTotal = utils.reduce(utils.pluck(this.$el.find('.amenity-checkbox:checked'), 'value'), function(total, val) {
        return total + parseInt(val);
      }, 0);
      return this;
    },

    updateSummary: function(e){
      var data = { amenities_total: this.amenityTotal, total: this.model.get('total') + this.amenityTotal };
      var updatedOrder = _.extend(this.model.toJSON(), data);
      this.options.orderView.$el.find('.totals').html(Handlebars.partials.totals({order: updatedOrder}));
      return this;
    },

    update: function (e) {
      // crappy placeholder
      var $el = $(e.target);
      var amenityId = $el.attr('data-amenity-id');
      var orderId = this.model.id;
      var add = $el.is(':checked');
      if ( add ) {
        var url = '/api/orders/' + orderId + '/amenities';
        $.ajax({
          type: 'POST'
        , url: url
        , data: { amenity_id: amenityId, order_id: orderId }
        , success: function() {
            console.log('insert success');
          }
        , error: function() {
            console.log('insert error');
          }
        });
      } else {
        var url = '/api/orders/' + orderId + '/amenities/' + amenityId;
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
        .cacheTotal()
        .updateSummary(e)
        .update(e);
    }

  });
});