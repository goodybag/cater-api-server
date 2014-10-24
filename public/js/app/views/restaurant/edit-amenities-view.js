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
      var $table = $(Handlebars.partials.amenity_table()).find('.table');

      var myviews = [];
      // Render each row
      this.amenities.each(function(amenity) {
        var rowView = new AmenityRowView({ amenity: amenity });
        $table.append(rowView.render().el);
        myviews.push(rowView);
      });
      // Repaint one time!
      this.$el.find('.table').html($table);
      myviews.forEach(function(view) {
        console.log(view);
        view.delegateEvents();
      });
    }

  });

  return EditAmenitiesView;
});
