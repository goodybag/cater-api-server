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
  var notify = require('notify');

  return module.exports = Backbone.View.extend({
    events: {
      'change input[type="checkbox"]': 'onAmenityToggle'
    },

    initialize: function() {
      this.options.order.on('change:guests', this.updateQuantity.bind(this));

      this.model.on('change:quantity', this.updatePrice.bind(this));

      this.listenTo(this.model, 'change:checked', this.onToggle.bind(this));

      this.$price = this.$el.find('.amenity-price');
    },

    updateQuantity: function() {
      // Cache local quantity per amenity
      this.model.set('quantity', this.options.order.get('guests'));
    },

    updatePrice: function() {
      if ( this.model.get('scale') === 'multiply' )
        this.$price.text('(' + Handlebars.helpers.surcharge(this.model.get('price')) + ' per person)');
      else
        this.$price.text('(' + Handlebars.helpers.surcharge(this.model.get('price')) + ')');
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
          }
        , error: function() {
            notify.error('Unable to add amenity');
          }
        });
      } else {
        var url = '/api/orders/' + orderId + '/amenities/' + this.model.id;
        $.ajax({
          type: 'DELETE'
        , url: url
        , success: function() {
          }
        , error: function() {
            notify.error('Unable to remove amenity');
          }
        });
      }
      return this;
    },

    onToggle: function() {
      return this.update();
    },

    onAmenityToggle: function (e){
      this.model.set('checked', !this.model.get('checked'));
    }
  });
});
