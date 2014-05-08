define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');

  return module.exports = Backbone.View.extend({
    events: {
      'change input[type="filepicker"]': 'onFilePickerChange'
    , 'submit .form-add-photo': 'addPhoto'
    },

    initialize: function() {
    },

    addPhoto: function(e) {
      // todo validate url / show error alert 
      this.collection.create({
        url:          this.$el.find('input[name="url"]').val()
      , name:         this.$el.find('input[name="name"]').val()
      , description:  this.$el.find('input[name="description"]').val()
      });
    },

    onFilePickerChange: function(e){
      var $input = $(e.originalEvent.target);
      $input.siblings('[data-name="' + $input.attr('name') + '"]').attr(
        'src', $input.val()
      );
    },

  });
});
