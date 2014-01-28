define(function(require, exports, module) {
  var Backbone = require('backbone');

  return module.exports = Backbone.View.extend({
    events: {
      'click .top-form-toggle': 'toggleTopForm',
      'blur .top-form input[type="email"]': 'mirrorEmails',
      'submit form.forgot-password-form': 'forgotPassword',
      'submit form.login-form': 'login'
    },

    toggleTopForm: function(e) {
      e.preventDefault();
      this.$el.find('form.top-form').toggleClass('hide');
      this.$el.find('.top-form:visible input[type="email"]').focus();
    },

    mirrorEmails: function(e) {
      this.$el.find('.top-form input[type="email"]').val(e.currentTarget.value);
    },

    forgotPassword: function(e) {
      e.preventDefault();

      this.$el.find('form.forgot-password-form .alert').addClass('hide');
      this.$el.find('form.forgot-password-form .form-group').removeClass('has-error');

      var email = this.$el.find('.forgot-password-form input[type="email"]').val().trim();
      if (!/.+@.+\..+/.test(email)) {
        this.$el.find('form.forgot-password-form .alert-danger').text('You must supply a valid email.').removeClass('hide');
        this.$el.find('form.forgot-password-form input[type="email"]').parent().addClass('has-error');
        return;
      }

      var self = this;
      $.ajax({
        url: '/password-resets',
        type: 'POST',
        data: JSON.stringify({email: email}),
        contentType: 'application/json',
        error: function(jqXHR, textStatus, errorThrown) {
          self.$el.find('form.forgot-password-form .alert-danger').text("We don't have an account for that email.").removeClass('hide');
        },
        success: function(data, textStatus, jqXHR) {
          self.$el.find('form.forgot-password-form .alert-success').removeClass('hide');
        }
      });
    },

    login: function(e) {
      mixpanel.track('Login');
    }
  });
});