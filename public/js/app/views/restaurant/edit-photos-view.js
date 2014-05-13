define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');

  return module.exports = Backbone.View.extend({
    template: Handlebars.partials.edit_photos_list,

    events: {
      'change input[type="filepicker"]': 'onFilePickerChange'
    , 'submit .form-add-photo': 'addPhoto'
    , 'submit .form-update-photo': 'updatePhoto'
    , 'click .btn-remove-photo': 'removePhoto'
    },

    initialize: function() {
      this.sortable();
    },

    addPhoto: function(e) {
      // todo validate url / show error alert
      var this_ = this;
      e.preventDefault();
      var $form = this.$el.find('.form-add-photo');
      this.collection.create({
        url:          $form.find('input[name="url"]').val()
      , name:         $form.find('input[name="name"]').val()
      , description:  $form.find('textarea[name="description"]').val()
      }, { 
        wait: true 
      , success: this.render.bind(this)
      });
    },

    updatePhoto: function(e) {
      e.preventDefault();
      var $photo = $(e.target).closest('li');
      var id = $photo.data('id');

      this.collection.get(id).save({
        url:          $photo.find('input[name="url"]').val()
      , name:         $photo.find('input[name="name"]').val()
      , description:  $photo.find('textarea[name="description"]').val()
      }, {
        wait: true
      , success: this.render.bind(this)
      });

      // todo hook into success/fail callbacks
      // to show respective alert view
    },

    removePhoto: function(e) {
      e.preventDefault();
      var $photo = $(e.target).closest('li');
      var id = $photo.data('id');
      this.collection.get(id).destroy();

      // todo hook into success/fail callbacks
      // to show respective alert view
      this.render();
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
        update: this.onItemMoved.bind(this)
      });
    },

    onItemMoved: function() {
      var this_ = this;
      // 1. re-index photos
      // 2, sort collection for re-rendering template
      this.$el.find('.photo-list li').each(function(index, element) {
        var id = $(element).data('id');
        this_.collection.get(id).save( { priority: index } );
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
