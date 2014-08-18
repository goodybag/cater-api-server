define(function(require, exports, module) {
  var utils = require('utils');
  var EditRestaurantView = require('./edit-restaurant-view');
  var Handlebars = require('handlebars');

  return module.exports = EditRestaurantView.extend({

    events: function() {
      return _.extend({}, EditRestaurantView.prototype.events, {
        'click .btn-add-delivery-tier': 'addDeliveryTierClick'
      , 'click .btn-remove-delivery-tier': 'removeDeliveryTierClick'
      });
    },

    fieldMap: {
      delivery_zips:    '.delivery-zip-group'
    , minimum_order:    '.minimum_order'
    , disable_courier:  '.disable-courier'
    },

    fieldGetters: _.extend({
      disable_courier: function() {
        return this.$el.find(this.fieldMap.disable_courier).is(':checked');
      },

      minimum_order: function() {
        return +Handlebars.helpers.pennies( this.$el.find('.minimum-order').val() ) || null;
      },

      delivery_zips: function() {
        var delivery_zips = []
        this.$el.find('.delivery-zip-group').each(function() {
          var $group = $(this);
          var fee = +Handlebars.helpers.pennies( $group.find('[name="fee"]').val() );
          $group.find('[name="zips"]').val()
            .replace( /\s/g, '' )
            .split(',')
            .map( function( z ){
              return parseInt( z );
            }).forEach( function( zip ){
              delivery_zips.push({
                fee: fee
              , zip: zip
              })
            });
        });
        return delivery_zips;
      }
    }, EditRestaurantView.prototype.fieldGetters ),


    addDeliveryTier: function() {
      var last = this.$el.find('.delivery-zip-group:last-child');
      var clone = last.clone();
      clone.find('input').val('');
      last.after(clone);
    },

    removeDeliveryTier: function($tier) {
      var len = this.$el.find('.delivery-zip-group').length;
      if ( len <= 1 )
        $tier.find('input').val('');
      else
        $tier.remove();
    },

    removeDeliveryTierClick: function(e) {
      e.preventDefault();
      var $tier = $(e.target).closest('.delivery-zip-group');
      this.removeDeliveryTier($tier);
    },

    addDeliveryTierClick: function(e) {
      e.preventDefault();
      this.addDeliveryTier();
    },

    initialize: function() {
    }

  });
});
