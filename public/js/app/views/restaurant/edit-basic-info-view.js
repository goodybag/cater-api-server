define(function(require, exports, module) {
  var utils = require('utils');
  var EditRestaurantView = require('./edit-restaurant-view');
  var Handlebars = require('handlebars');

  return module.exports = EditRestaurantView.extend({
    events: function() {
      return _.extend({}, EditRestaurantView.prototype.events, {
        'change input[type="filepicker"]': 'onFilePickerChange'
      });
    },

    fieldMap: {
      name:                                     '#input-name'
    , description:                              '#input-description'
    , websites:                                 '#input-websites'
    , yelp_business_id:                         '#input-yelp'
    , is_hidden:                                '#input-hidden'
    , is_archived:                              '#input-archived'
    , is_featured:                              '#input-featured'
    , logo_url:                                 '#input-logo-url'
    , region_id:                                '[name="region_id"]'
    , is_fee_on_total:                          '[name="is_fee_on_total"]'
    , is_direct_deposit:                        '[name="is_direct_deposit"]'
    , list_photo_url:                           '[name="list_photo_url"]'
    , cover_photo_url:                          '[name="cover_photo_url"]'
    , supported_order_types:                    '[name="supported_order_types"]'
    , accepts_tips:                             '[name="accepts_tips"]'
    },

    fieldGetters: _.extend({
      websites: function() {
        return _.map(EditRestaurantView.fieldSplit.call(this, this.fieldMap.websites), Handlebars.helpers.website);
      },

      is_hidden: function() {
        return this.$el.find(this.fieldMap.is_hidden).is(':checked');
      },

      is_archived: function() {
        return this.$el.find(this.fieldMap.is_archived).is(':checked');
      },

      is_featured: function() {
        return this.$el.find(this.fieldMap.is_featured).is(':checked');
      },

      accepts_tips: function() {
        return this.$el.find(this.fieldMap.accepts_tips).is(':checked');
      },

      yelp_business_id: function() {
        var url = this.$el.find(this.fieldMap.yelp_business_id).val();
        if (!url) return null;
        if (url.indexOf('/') === -1) return null;

        url = url.split('/').pop();
        return url.split('#')[0];
      }
    }, EditRestaurantView.prototype.fieldGetters ),

    initialize: function() {
      // ensure gb_fee is number type
      this.model.set('gb_fee', +this.model.get('gb_fee'));
    },

    onFilePickerChange: function(e){
      var $input = $(e.originalEvent.target);
      $input.siblings('[data-name="' + $input.attr('name') + '"]').attr(
        'src', $input.val()
      );
    }
  });
});
