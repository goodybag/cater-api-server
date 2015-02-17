define(function (require, exports, module) {
  var utils = require('utils');
  var notify = require('../../notify');
  var FormView = require('./form-view');

  return FormView.extend({
    events: {
      'submit #user-settings-form': 'submit'
    , 'click .close':               'hideAlert'
    },

    fieldMap: {
      name:              '.user-name'
    , email:             '.user-email'
    , password:          '.user-password'
    , organization:      '.user-organization'
    },

    submit: function (e) {
      e.preventDefault();
      this.clearErrors();

      var fields = {
        organization: this.$el.find('[name="organization"]').val()
      , password: this.$el.find('input[name="password"]').val()
      , confirm_password: this.$el.find('#user-confirm-password').val()
      };

      var errors = [];

      if (fields.password && fields.password !== fields.confirm_password) {
        errors.push({
          message: 'passwords must match'
        , selector: '#confirm-password-label'
        });
      }

      if (errors.length) {
        return this.displayErrors(errors);
      }

      var diff = this.getDiff();

      if (diff && !diff.password) {
        diff.password = null;
      }

      var view = this;
      this.model.set(diff);
      this.model.save(null, {
        patch: true
      , wait: true
      , validate: false
      , success: function (model, response, options) {
          view.clearErrors();
          $('.alert-success').show();
        }
      , error: function (model, response, options) {
          view.clearErrors();
          notify.error(response);       
          $('.alert-danger').show();
        }
      });
    },

    displayErrors: function (errors) {
      if (!errors || errors.length < 1) return;
      errors.forEach(function (error) {
        var $el = $(error.selector);
        $el.find('.error-message').removeClass('hide');
        $el.closest('.form-group').addClass('has-error');
      })
      return this;
    },

    clearErrors: function () {
      this.$el.find('.error-message').addClass('hide');
      this.$el.find('.form-group').removeClass('has-error');
    },

    hideAlert: function (e) {
      e.preventDefault();
      var $el = $(e.target);
      $el.parent().fadeOut(200); 
    }
  });
});