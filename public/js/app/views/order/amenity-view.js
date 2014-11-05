/**
 * Handles changes to order amenities like adding
 * plates, napkins, utensils and updating total summary.
 *
 * Feature Checklist
 * 1. Changing guests will recalculate amenity item-price
 * 2. Toggle amenity in the item summary
 * 3. Update total
 */

define(function(require, exports, module) {
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var utils = require('utils');

  return module.exports = Backbone.View.extend({
    events: {
      'change input[type="checkbox"]': 'onAmenityToggle'
    },

    initialize: function() {
      this.options.order.on('change:guests', this.updateQuantity.bind(this));

      this.model.on('change:quantity', this.updatePrice.bind(this));
      this.model.on('change:quantity', this.updateSummaryItem.bind(this));

      this.listenTo(this.model, 'change:checked', this.onToggle.bind(this));

      this.$price = this.$el.find('.amenity-price');
      this.$summaryItem = this.options.orderView.$el
        .find('.order-table [data-amenity-id="' + this.model.id + '"]');
    },

    updateQuantity: function() {
      // Cache local quantity per amenity
      this.model.set('quantity', this.options.order.get('guests'));
    },

    updatePrice: function() {
      this.$price.text('(' + Handlebars.helpers.surcharge(this.model.getTotalPrice()) + ')');
      return this;
    },

    updateSummaryItem: function(){
      var checked = this.model.get('checked');
      var price = this.model.getTotalPrice();
      var delta = (checked ? 1 : -1 ) * price;

      // 1. Update order items
      this.$summaryItem
      .find('.item-price')
      .text(Handlebars.helpers.surcharge(price));

      // 2. Update totals
      this.options.order.set({
        total: this.options.order.get('total') + delta
      , sub_total: this.options.order.get('sub_total') + delta
      });

      return this;
    },

    update: function () {
      // crappy placeholder
      var orderId = this.options.order.id;
      var add = this.model.get('checked');
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

    toggleSummaryItem: function() {
      this.$summaryItem.toggleClass('hide');
      return this;
    },

    onToggle: function() {
      return this
        // .toggleSummaryItem()
        // .updateSummaryItem() // these should not live here
        .update();
    },

    onAmenityToggle: function (e){
      this.model.set('checked', !this.model.get('checked'));
    }
  });
});
