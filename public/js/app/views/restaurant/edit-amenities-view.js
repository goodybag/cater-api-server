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
    },

    render: function() {
      var context = { amenities: this.amenities.toJSON() };
      var markup = Handlebars.partials.edit_restaurant_amenities(context);
      this.$el.html(markup);
    }

  });

  return EditAmenitiesView;
});
