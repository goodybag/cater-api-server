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
    , minimum_order:    '.minimum-order'
    },

    fieldGetters: _.extend({
      minimum_order: function() {
        return +Handlebars.helpers.pennies( this.$el.find(this.fieldMap.minimum_order).val() ) || null;
      },

      delivery_zips: function() {
        return utils.uniq(this.$el.find(this.fieldMap.delivery_zips).map(function (i, el) {
          var $el = $(el);
          return $el.find('input[name="zips"]').val()
            .replace( /\s/g, '' )
            .split(',')
            .filter(function ( zip ) {
              return zip.length === 5 && +(zip);
            }).map(function ( zip ) {
              return {
                fee: +Handlebars.helpers.pennies( $el.find('#input-minimum-order').val() )
              , zip: zip
              };
            })
        }), 'zip');
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
