define(function(require, exports, module) {
  var utils = require('utils');
  var EditRestaurantView = require('./edit-restaurant-view');
  var Handlebars = require('handlebars');

  return module.exports = EditRestaurantView.extend({

    events: {
      'submit .form-basic-info': 'save'
    , 'change input[type="filepicker"]': 'onFilePickerChange'
    },

    fieldMap: {
      name:                   '#input-name'
    , description:            '#input-description'
    , websites:               '#input-websites'
    , yelp_business_id:       '#input-yelp'
    , is_hidden:              '#input-hidden'
    },

    fieldGetters: {
      websites: function() {
        return _.map(EditRestaurantView.fieldSplit.call(this, this.fieldMap.websites), Handlebars.helpers.website);
      },

      is_hidden: function() {
        return this.$el.find(this.fieldMap.is_hidden).is(':checked');
      },

      yelp_business_id: function() {
        var url = this.$el.find(this.fieldMap.yelp_business_id).val();
        if (!url) return null;
        if (url.indexOf('/') === -1) return null;

        url = url.split('/').pop();
        return url.split('#')[0];
      }
    },

    initialize: function() {
    },

    onFilePickerChange: function(e){
      var $input = $(e.originalEvent.target);
      $input.siblings('[data-name="' + $input.attr('name') + '"]').attr(
        'src', $input.val()
      );
    },

  });
});
