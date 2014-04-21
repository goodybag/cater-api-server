define(function(require, exports, module) {
  var utils = require('utils');
  var FormView = require('../form-view');
  var Handlebars = require('handlebars');

  return module.exports = Backbone.View.extend({

    events: {
      'submit .form-basic-info': 'validate'
    },

    fieldMap: {
      name:                   '#input-name'
    , description:            '#input-description'
    , websites:               '#input-websites'
    , yelp_business_id:       '#input-yelp'
    , is_hidden:              '#input-hidden'
    , 'change input[type="filepicker"]': 'onFilePickerChange',
    },

    fieldGetters: {
      websites: function() {
        return _.map(FormView.fieldSplit.call(this, this.fieldMap.websites), Handlebars.helpers.website);
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

    getFields: function() {
      var this_ = this;
      var values = utils.map(this.fieldMap, function(selector, field, fieldMap) {

        return this_.fieldGetters[field] ?
          this_.fieldGetters[field].call(this_ ,selector) // Use custom getter
          : this_.$el.find(selector).val();    // or return value
      });
      return utils.object(utils.keys(this_.fieldMap), values);
    },

    clearErrors: function() {
      this.$el.find('.has-error').removeClass('has-error');
    },

    /**
     * Attaches .has-error class to each field
     * failing validation
     */
    displayErrors: function(errors) {
      var this_ = this;
      console.log(this.model.validationError);
      this.clearErrors();
      if (errors) {
        this_.options.alertView && this_.options.alertView.show('error');
        utils.each(errors, function(error) {
          this_.$el
            .find('input[name="' + error.property + '"]')
            .closest('.form-group')
            .addClass('has-error');
        });
      };
    },

    validate: function(e) {
      e.preventDefault();
      this.model.save(this.getFields(), {
        patch: true
      , success: this.options.alertView.show.bind(this.options.alertView, 'success')
      , error: this.options.alertView.show.bind(this.options.alertView, 'error')
      });

      this.displayErrors(this.model.validationError);
    },

    onFilePickerChange: function(e){
      console.log('changepicker');
      var $input = $(e.originalEvent.target);
      $input.siblings('[data-name="' + $input.attr('name') + '"]').attr(
        'src', $input.val()
      );
    },

  });
});
