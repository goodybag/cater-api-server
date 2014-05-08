define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');

  return module.exports = Backbone.View.extend({
    template: Handlebars.partials.edit_photos_list,

    events: {
      'change input[type="filepicker"]': 'onFilePickerChange'
    , 'submit .form-add-photo': 'addPhoto'
    },

    initialize: function() {
    },

    addPhoto: function(e) {
      // todo validate url / show error alert
      e.preventDefault();
      this.collection.create({
        url:          this.$el.find('input[name="url"]').val()
      , name:         this.$el.find('input[name="name"]').val()
      , description:  this.$el.find('textarea[name="description"]').val()
      });
      this.render();
    },

    render: function() {
      var html = this.template({
        restaurant_photos: this.collection.toJSON()
      , config: { defaultLogo: this.options.defaultLogo }
      });
      this.$el.html(html);
      filepicker.constructWidget(this.$el.find('input[type="filepicker"]'));
    },

    onFilePickerChange: function(e){
      var $input = $(e.originalEvent.target);
      $input.siblings('[data-name="' + $input.attr('name') + '"]').attr(
        'src', $input.val()
      );
    },

  });
});
