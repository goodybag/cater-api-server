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
      this.collection.create({
        url: 'lol'
      , name: 'lol'
      , description: 'lol'
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
