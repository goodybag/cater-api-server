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
      this.amenities.add(new Amenity());
    },

    initialize: function(){

      var this_ = this;
      this.$table = this.$el.find('#amenities-table');
      this.amenities = this.options.amenities || new Amenities();
      this.amenityRowViews = this.amenities.map(function(amenity) {
        var view = new AmenityRowView({ amenity: amenity });
        this_.$table.append(view.render().el);
        return view;
      });

      this.listenTo(this.amenities, 'add', this.addOne);
    },

    addOne: function(amenity) {
      var view = new AmenityRowView({ amenity: amenity });
      this.$table.append(view.render().el);
    },

    render: function() {
      this.$el.html( this.template() );
      return this;
    },

    renderNested: function( views, selector ) {
      var this_ = this;
    }

  });

  return EditAmenitiesView;
});
