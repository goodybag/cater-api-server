define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');

  return module.exports = Backbone.View.extend({
    template: Handlebars.partials.edit_photos_list,

    events: {
      'change input[type="filepicker"]':  'onFilePickerChange'
    , 'submit .form-add-photo':           'addPhoto'
    , 'submit .form-update-photo':        'updatePhoto'
    , 'click .btn-remove-photo':          'removePhoto'
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

    addPhoto: function(e) {
      e.preventDefault();
      var this_ = this;
      var $form = this.$el.find('.form-add-photo');
      var data = this.getData($form);
      this.collection.create(data, { 
        wait: true 
      , success: this.alert({type: 'success', message: 'Added new photo! Good job'})
      , error:   this.alert({type: 'error', message: 'Could not add photo'})
      });
    },

    updatePhoto: function(e) {
      e.preventDefault();
      var $photo = $(e.target).closest('li');
      var id = $photo.data('id');
      var data = this.getData($photo);
      this.collection.get(id).save(data, {
        wait: true
      , success: this.alert({type: 'success', message: 'Updated successfully!'})
      , error:   this.alert({type: 'error', message: 'Could not update photo'})
      });
    },

    removePhoto: function(e) {
      e.preventDefault();
      var $photo = $(e.target).closest('li');
      var id = $photo.data('id');
      this.collection.get(id).destroy({
        wait: true
      , success: this.alert({ type: 'success', message: 'Removed photo!' })
      , error: this.alert({ type: 'error', message: 'Could not remove photo' })
      });
    },

    alert: function(opts) {
      var this_ = this;
      opts = opts || {};
      opts.type = opts.type || 'success';
      opts.message = opts.message || 'Saved Successfully'

      var context = { 
        message: opts.message
      };

      return function() {
        this_.options.alertView.show(opts.type, context);
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
      , update: this.onItemMoved()
      });
    },

    onItemMoved: function() {
      var this_ = this;

      // 1. re-index photos
      // 2. show alert  TODO
      // 3. sort collection for re-rendering template
      return function() {
        this_.$el.find('.photo-list li').each(function(index, element) {
          var id = $(element).data('id');
          var check = this_.collection.get(id).save( { priority: index } );
        });
        this_.collection.sort();
      }
    },

    onFilePickerChange: function(e){
      var $input = $(e.originalEvent.target);
      $input.siblings('[data-name="' + $input.attr('name') + '"]').attr(
        'src', $input.val()
      );
    }
  });
});
