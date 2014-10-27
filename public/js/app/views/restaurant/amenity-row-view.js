define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var Amenity = require('app/models/amenity');
  var ItemForm = require('app/views/admin/item-form');

  var AmenityRowView = module.exports = ItemForm.extend({
    template: Handlebars.partials.amenity_row,

    tagName: 'tr',

    events: {
      'click .js-btn-edit':      'onBtnEditClick'
    , 'click .js-btn-save':      'onBtnSaveClick'
    , 'click .js-btn-delete':    'onBtnDeleteClick'
    },

    onBtnEditClick: function(e){
      e.preventDefault();
      this.toggleEditMode();
    },

    onBtnSaveClick: function(e){
      e.preventDefault();
      this.onSubmit(e);
    },

    toggleEditMode: function() {
      this.$el.find('.js-read, .js-edit').toggleClass('hide');
      return this;
    },

    initialize: function() {
      var this_ = this;

      this.on('item:saved', function() {
        this_.render();
      });

      this.on('item:error', function() {
      });

      this.on('item:destroyed', function() {
        this.remove();
      });
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    }
  });

  return AmenityRowView;
});
