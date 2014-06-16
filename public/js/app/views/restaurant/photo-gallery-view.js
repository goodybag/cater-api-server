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
      var photoIdx = $(e.target).data('photo-idx');
      var photo = this.options.photos.setCurrent(photoIdx);
      this.changePhoto(photo);
    },

    nextClick: function(e) {
      e.preventDefault();
      this.next();
    },

    previousClick: function(e) {
      e.preventDefault();
      this.prev();
    },

    /**
     * 1. Update image, name, description
     * 2. Apply .active
     * 3. Scroll to photo
     */
    changePhoto: function(photo) {
      console.log('change:'+photo.id);
      var idx = this.options.photos.indexOf(photo);

      this.$img.attr('src', photo.get('url'));
      this.$name.text(photo.get('name'));
      this.$description.text(photo.get('description'));

      this.$el.find('.photo-thumbnail').removeClass('active');
      this.$el.find('.photo-thumbnail[data-photo-idx="' + idx + '"]').addClass('active');

      // this.scrollToPhoto();
    },

    scrollToPhoto: function(options) {
      options = options || {};
      options.offset = options.offset || 56;
      options.y = options.y || this.$img.offset().top - options.offset;
      options.duration = options.duration || 500;
      $('html, body').animate({ scrollTop: options.y}, options.duration);
    },

    next: function() {
      this.changePhoto(this.options.photos.next());
    },

    prev: function() {
      this.changePhoto(this.options.photos.prev());
    }
  });
});
