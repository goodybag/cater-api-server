define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var Amenity = require('app/models/amenity');

  var AmenityRowView = module.exports = Backbone.View.extend({
    events: {
      'click .btn-edit': 'onClickEdit'
    },

    onClickEdit: function(e){
      e.preventDefault();
      console.log('Clicked');
    },

    initialize: function() {
      this.amenity = this.amenity || new Amenity();
      console.log('hi');
    },

    render: function() {
      this.el = Handlebars.partials.amenity_row( this.options.amenity.toJSON() );
      return this;
    }
  });

  return AmenityRowView;
});
