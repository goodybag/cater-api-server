define(function(require, exports, module) {
  var Backbone = require('backbone');

  return module.exports = Backbone.View.extend({
    events: {
      'submit': 'submit'
    },

    submit: function(e) {
      e.preventDefault();

      this.$el.find('#form-error-alert').addClass('hide');
      this.$el.find('input').parent().removeClass('has-error');

      var pass1 = this.$el.find('#password').val();
      var pass2 = this.$el.find('#confirm-password').val();

      if (!pass1) {
        this.$el.find('#form-error-alert').text('Must supply a password').removeClass('hide');
        this.$el.find('#password').parent().addClass('has-error');
        return;
      }

      if (pass1 !== pass2) {
        this.$el.find('#form-error-alert').text('Passwords must match').removeClass('hide');
        this.$el.find('input').parent().addClass('has-error');
        return;
      }

      $.ajax({
        url: window.location.pathname,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({password: pass1}),
        error: function(jqXHR, textStatus, errorThrown) {
          alert(errorThrown);
        },
        success: function(data, textStatus, jqXHR) {
          location.href = '/';
        }
      });
    }
  });
});