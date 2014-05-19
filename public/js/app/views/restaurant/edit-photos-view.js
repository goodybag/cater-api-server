define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');

  return module.exports = Backbone.View.extend({
    template: Handlebars.partials.edit_photos_list,

    events: {
      'change input[type="filepicker"]':  'onFilePickerChange'
    , 'submit .form-add-photo':           'onAddPhotoFormSubmit'
    , 'submit .form-update-photo':        'onUpdatePhotoFormSubmit'
    , 'click .btn-remove-photo':          'onRemovePhotoClick'
    },

    initialize: function() {
      this.sortable();
    },

    getData: function($el) {
      return {
        url:          $el.find('input[name="url"]').val()
      , name:         $el.find('input[name="name"]').val()
      , description:  $el.find('textarea[name="description"]').val()
      };
    },

    onAddPhotoFormSubmit: function(e) {
      e.preventDefault();
      var $form = this.$el.find('.form-add-photo');
      var data = this.getData($form);
      this.addPhoto(data);
    },

    addPhoto: function(data) {
      this.collection.create(data, { 
        wait: true 
      , success: this.alert({type: 'success', message: 'Added new photo! Good job'})
      , error:   this.alert({type: 'error', message: 'Could not add photo'})
      });
    },

    onUpdatePhotoFormSubmit: function(e) {
      e.preventDefault();
      var $photo = $(e.target).closest('li');
      var id = $photo.data('id');
      var data = this.getData($photo);
      this.updatePhoto(id, data);
    },

    updatePhoto: function(id, data) {
      this.collection.get(id).save(data, {
        wait: true
      , success: this.alert({type: 'success', message: 'Updated successfully!'})
      , error:   this.alert({type: 'error', message: 'Could not update photo'})
      });
    },

    onRemovePhotoClick: function(e) {
      e.preventDefault();
      var $photo = $(e.target).closest('li');
      var id = $photo.data('id');
      this.removePhoto(id);
    },

    removePhoto: function(id) {
      this.collection.get(id).destroy({
        wait: true
      , success: this.alert({ type: 'success', message: 'Removed photo!' })
      , error: this.alert({ type: 'error', message: 'Could not remove photo' })
      });
    },

    alert: function(context) {
      var this_ = this;
      context = context || { type: 'success', message: 'Updated' };
      return function() {
        this_.options.alertView.show(context);
        this_.render();
      };
    },

    render: function() {
      var html = this.template({
        restaurant_photos: this.collection.toJSON()
      , config: { defaultLogo: this.options.defaultLogo }
      });
      this.$el.html(html);
      this.$el.find('input[type="filepicker"]').each(function() {
        filepicker.constructWidget( this );
      });
      this.sortable();
    },

    sortable: function() {
      this.$el.find('.photo-list').sortable({
        forcePlaceholderSize: true
      , placeholder: 'placeholder'
      , update: this.onItemMoved.bind(this)
      });
    },

    onItemMoved: function() {
      var this_ = this;
      this.$el.find('.photo-list li').each(function(index, element) {
        var id = $(element).data('id');
        var check = this_.collection.get(id).save( { priority: index } );
      });
      this.collection.sort();
    },

    onFilePickerChange: function(e){
      var $input = $(e.originalEvent.target);
      $input.siblings('[data-name="' + $input.attr('name') + '"]').attr(
        'src', $input.val()
      );
    }
  });
});
