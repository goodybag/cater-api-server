/**
 * This class provides automatic form validation on Backbone models
 * using Amanda schema validation.
 */
define(function(require, exports, module) {
  var Backbone = require('backbone');

  return module.exports = Backbone.View.extend({

    /**
     * Return an object containing the properties differing
     * between the Backbone model and the HTML form
     */
    getDiff: function() {
      var diff = {};

      for (var key in this.fieldMap) {
        var getter = this.fieldGetters[key];
        var $field = this.$el.find(this.fieldMap[key]);
        if ($field.length > 0) {
          var val = getter ? getter.apply(this) : ($field.val()||'').trim() || null;
          if (!(val == null && this.model.get(key) == null) && !_.isEqual(val, this.model.get(key)))
            diff[key] = val;
        }
      }

      return _.size(diff) > 0 ? diff : null;
    },

    /**
     * Override the default behavior of getDiff with a custom getter.
     * Useful for converting what the user sees on the form to the actual
     * backend data like currency representation or datetimes.
     */
    fieldGetters: {},

    /**
     * Map model properties to DOM selectors. This is used to
     * highlight invalid form fields.
     *
     * Example `{ name: '.form-name' }`
     */
    fieldMap: {},

    clearErrors: function() {
      this.$el.find('.form-group.has-error').removeClass('has-error');
    },

    displayErrors: function() {
      if (this.model.validationError == null) return;
      var errors = _.isArray(this.model.validationError) ? this.model.validationError :
        _.pick(this.model.validationError, _.range(this.model.validationError.length));

      var badFields =  _.uniq(_.invoke(_.compact(_.pluck(errors, 'property')), 'replace', /\[\d+\]$/, ''));
      var selector = _.values(_.pick(this.fieldMap, badFields)).join(', ');

      this.$el.find(selector)
        .closest('.form-group')
        .removeClass('has-success')
        .addClass('has-error');

      _.invoke(this.subViews, 'displayErrors');
    },

    // TODO: move to subclass
    onChange: function(e) {
      var diff = this.getDiff();
      this.$el.find(this.submitSelector).toggleClass('hide', !diff);
      return diff;
    },

    /**
     * Saves the model diff via PATCH.
     *
     * Triggers these events
     *  'save:noop'       no difference between model and form
     *  'save:invalid'    form failed validation
     *  'save:success'    server saved diff successfully
     *  'save:error'      server could not save diff

     *  @param e error details
     *  @param callback function(err, response)
     */
    onSave: function(e, callback) {
      if (callback === undefined && _.isFunction(e)) {
        callback = e;
        e = undefined;
      }
      if (e && _.isFunction(e.preventDefault)) e.preventDefault();
      callback = _.isFunction(callback) ? callback : function() {};
      this.clearErrors();
      var diff = this.getDiff();

      if (!diff && !this.model.isNew()) {
        this.trigger('save:noop');
        return callback.call(this);
      }
      var view = this;
      var sent = this.model.save(diff, {
        patch: true,
        wait: true,
        singleError: false,
        validate: typeof this.options.validate !== 'boolean' ? true : this.options.validate, // bypass client validation
        success: function(model, response, options) {
          view.$el.find(view.submitSelector).addClass('hide');
          view.trigger('save:success', view.model, response, view);
          callback.call(view, null, response);
        },
        error: function(model, response, options) {
          view.trigger('save:error', response, view);
          callback.call(view, response);
        }
      });

      if (!sent) {
        view.trigger('save:invalid', this.model.validationError);
        this.displayErrors();
        callback.call(this, this.model.validationError);
      }
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
    }
  });
});
