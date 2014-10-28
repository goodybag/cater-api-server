/**
 * Handles changes to order amenities like adding
 * plates, napkins, utensils and updating total summary.
 */

define(function(require, exports, module) {
  var Backbone = require('backbone');

  return module.exports = Backbone.View.extend({
    events: {
      'change .amenity-checkbox': 'onCheckboxChange'
    },

    initialize: function() {
      // this.tip = this.model.get('tip');
      // this.amenityTotal = 
      // this.$el.find('.tip_percent').val(this.model.get('tip_percent') || 0);
    },

    onCheckboxChange: function(e){
      console.log('poop');
    }
  });
});