define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var Amenity = require('app/models/amenity');

  var AmenityRowView = module.exports = Backbone.View.extend({
    template: Handlebars.partials.amenity_row,

    tagName: 'tr',

    events: {
      'click .btn-edit': 'onClickEdit'
    , 'click .btn-remove': 'onClickRemove'
    },

    onClickEdit: function(e){
      e.preventDefault();
      this.editMode = !this.editMode;
      this.trigger('toggle:edit', this.editMode);
    },

    onClickRemove: function(e) {
      // this.options.amenity.destroy();
      this.remove();
      return this;
    },

    toggleEdit: function(toggle) {
      this.$el.find('.hide').removeClass('hide');
      if (toggle) {
        this.$el.find('.amenity-read').addClass('hide');
      } else {
        this.$el.find('.amenity-edit').addClass('hide');
      }
    },

    initialize: function() {
      this.amenity = this.amenity || new Amenity();
      this.editMode = false;
      console.log('hi');

      this.on('toggle:edit', this.toggleEdit);
    },

    render: function() {
      // this.el = Handlebars.partials.amenity_row( this.options.amenity.toJSON() );
      console.log('rending row view');
      this.$el.html(this.template(this.options.amenity.toJSON()));
      return this;
    }
  });

  return AmenityRowView;
});
