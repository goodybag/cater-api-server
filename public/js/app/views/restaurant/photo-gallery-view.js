/**
 * Photo Gallery View
 */

define(function(require, exports, module) {

  var utils = require('utils');
  var notify = require('notify');

  return module.exports = Backbone.View.extend({

    events: {
      'click .photo-thumbnail':     'changePhotoClick'
    , 'click .next':                'nextClick'
    , 'click .previous':            'previousClick'
    },

    initialize: function() {
      x = this.options.photos;

      this.$img = this.$el.find('.selected-photo img');
      this.$name = this.$el.find('.selected-photo .photo-name');
      this.$description = this.$el.find('.selected-photo .photo-description');
    },

    changePhotoClick: function(e) {
      e.preventDefault();
      var photoId = $(e.target).data('photo-id');
      this.changePhoto(photoId);
    },

    nextClick: function(e) {
      e.preventDefault();
    },

    previousClick: function(e) {
      e.preventDefault();
    },

    changePhoto: function(id) {
      var photo = this.options.photos.find({id: id});
      console.log('change:'+id);
      this.$img.attr('src', photo.get('url'));
      this.$name.text(photo.get('name'));
      this.$description.text(photo.get('description'));
      this.$el.find('.photo-thumbnail').removeClass('active');
      this.$el.find('.photo-thumbnail[data-photo-id="' + id + '"]').addClass('active');
      this.scrollToPhoto();
    },

    scrollToPhoto: function(options) {
      options = options || {};
      options.offset = options.offset || 56;
      options.y = options.y || this.$img.offset().top - options.offset;
      options.duration = options.duration || 500;
      $('html, body').animate({ scrollTop: options.y}, options.duration);
    },

    next: function() {

    },

    previous: function() {

    }
  });
});
