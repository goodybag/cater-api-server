/**
 * Provides simple validation error highlighting
 * and alerts.
 *
 * Assumes this.model and this.alertView are defined
 */
define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var FormView2 = require('../form-view-2');

  return module.exports = FormView2.extend({
    events: {
      'submit .ap-form': 'save'
    },

    // Fields that should be nulled if the value retrieved
    // from the DOM is an empty string
    nullOnEmptyString: [],

    fieldMap: {
    },

    fieldGetters: {
      "default": function( key, $el ){
        return this.getDomValue( key, $el );
      }
    },

    initialize: function() {
      this.fieldMap = this.options.fieldMap || this.fieldMap;
    },

    getField: function(selector, field, fieldMap) {
      field = field in this.fieldGetters ? field : 'default';
      if (this.fieldGetters[field]) {
        return this.fieldGetters[field].apply(
          this
          // Default gets field as first argument
        , (field === 'default' ? [field] : []).concat( this.$el.find(selector) )
        );
      }
    },

    getFields: function() {
      var values = utils.map(this.fieldMap, this.getField.bind(this));
      values = utils.object(utils.keys(this.fieldMap), values);

      for ( var key in values ){
        if ( values[ key ] === '' || values[ key ] === NaN )
        if ( this.nullOnEmptyString.indexOf( key ) > -1 ){
          values[ key ] = null;
        }
      }

      return values;
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
        patch:        true
      , wait:         true
      , singleError:  false
      , success:      this.options.alertView.show.bind(this.options.alertView, 'success')
      , error:        this.options.alertView.show.bind(this.options.alertView, 'error')
      });

      this.displayErrors(this.model.validationError);
    }
  }, {

    /**
     * Static methods
     */

    intGetter: function($el) {
      var val = ($el.val()||'').trim();
      return val ? parseInt(val) : null;
    },
    floatGetter: function($el) {
      var val = ($el.val()||'').trim();
      return val ? parseFloat(val) : null;
    },
    dollarsGetter: function($el) {
      var val = parseFloat(($el.val()||'').trim())
      return !_.isNaN(val) ? Math.round(val * 100) : null;
    },

    fieldSplit: function(selector, delimiter) {
      delimiter = delimiter || ',';
      var val = this.$el.find(selector).val().trim();
      return val ? _.invoke(val.split(delimiter), 'trim') : [];
    }
  });
});
