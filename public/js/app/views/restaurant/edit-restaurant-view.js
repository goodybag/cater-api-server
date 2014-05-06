/**
 * Provides simple validation error highlighting
 * and alerts.
 *
 * Assumes this.model and this.alertView are defined
 */
define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');

  return module.exports = Backbone.View.extend({
    events: {
      'submit .ap-form': 'save'
    },

    fieldMap: {
    },

    fieldGetters: {
    },

    initialize: function() {
    },

    getField: function(selector, field, fieldMap) {
      return this.fieldGetters[field] ?
        this.fieldGetters[field].call(this, selector)
      : this.$el.find(selector).val();
    },

    getFields: function() {
      var values = utils.map(this.fieldMap, this.getField.bind(this));
      return utils.object(utils.keys(this.fieldMap), values);
    },

    clearErrors: function() {
      this.$el.find('.has-error').removeClass('has-error');
    },

    /**
     * Attaches .has-error class to each field
     * failing validation
     */
    displayErrors: function(errors) {
      console.log(errors);
      var this_ = this;
      this.clearErrors();
      if (errors) {
        this_.options.alertView && this_.options.alertView.show('error');
        utils.each(errors, function(error) {
          this_.$el
            .find('input[name="' + error.property.replace(/\[\d+\]$/, '') + '"]')
            .closest('.form-group')
            .addClass('has-error');
        });
      };
    },

    save: function(e) {
      e.preventDefault();
      this.model.save(this.getFields(), {
        patch:    true
      , wait: true
      , singleError: false
      , success:  this.options.alertView.show.bind(this.options.alertView, 'success')
      , error:    this.options.alertView.show.bind(this.options.alertView, 'error')
      });
      this.displayErrors(this.model.validationError);
    }
  }, {

    /**
     * Static methods
     */

    intGetter: function(field) {
      var val = (this.$el.find(this.fieldMap[field]).val()||'').trim();
      return val ? parseInt(val) : null;
    },
    floatGetter: function(field) {
      var val = (this.$el.find(this.fieldMap[field]).val()||'').trim();
      return val ? parseFloat(val) : null;
    },
    dollarsGetter: function(field) {
      var val = parseFloat((this.$el.find(this.fieldMap[field]).val()||'').trim())
      return !_.isNaN(val) ? Math.round(val * 100) : null;
    },

    fieldSplit: function(selector, delimiter) {
      delimiter = delimiter || ',';
      var val = this.$el.find(selector).val().trim();
      return val ? _.invoke(val.split(delimiter), 'trim') : [];
    }
  });
});
