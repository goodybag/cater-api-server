/**
 * Amenities View
 */

define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var Amenities = require('app/collections/amenities');
  var Amenity = require('app/models/amenity');
  var AmenityRowView = require('app/views/restaurant/amenity-row-view');

  var EditAmenitiesView = module.exports = Backbone.View.extend({
    template: Handlebars.partials.amenity_table,

    events: {
      'click .btn-add-amenity': 'onAddAmenityClick'
    },

    onAddAmenityClick: function(e){
      var amenity = new Amenity({ restaurant_id: this.options.restaurant_id });
      this.amenities.add(amenity);
    },

    initialize: function(){
      var this_ = this;
      this.$table = this.$el.find('#amenities-table');
      this.amenities = this.options.amenities || new Amenities();
      this.amenityRowViews = this.amenities.map(function renderRow(amenity) {
        var view = new AmenityRowView({ model: amenity });
        this_.$table.append(view.render().el);
        return view;
      });

      this.listenTo(this.amenities, 'add', this.addOne);
    },

    addOne: function(amenity) {
      var view = new AmenityRowView({ model: amenity });
      this.$table.append(view.render().el);
    }
  });

  return EditAmenitiesView;
});
