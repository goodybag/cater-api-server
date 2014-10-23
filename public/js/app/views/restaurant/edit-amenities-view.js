/**
 * Amenities View
 */

define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var Amenities = require('app/collections/amenities');
  var Amenity = require('app/models/amenity');

  var EditAmenitiesView = module.exports = Backbone.View.extend({

    events: {
      'click .btn-add-amenity': 'onAddAmenityClick'
    },

    onAddAmenityClick: function(e){
      this.amenities.add(new Amenity());
    },

    listen: function() {
      this.amenities.on('add', this.render.bind(this));
    },

    initialize: function(opts){
      this.amenities = opts.amenities || new Amenities();
      this.listen();
      this.render();
    },

    render: function() {
      // Render table in memory
      var $table = $(Handlebars.partials.amenity_table());

      // Render each row
      this.amenities.each(function(amenity) {
        var rowView = new AmenityRowView(amenity);
        $table.append()
      })
      // Repaint one time!
      // this.$el.html($html);
    }

  });

  return EditAmenitiesView;
});
