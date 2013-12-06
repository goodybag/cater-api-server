define(function(require, exports, module) {
  var FormView = require('./form-view');

  module.exports = FormView.extend({
    submitSelector: '.contact-us-form .contact-us-send',
    alertSelector: '.contact-us-container .contact-us-alert',

    events: {
      'submit .contact-us-form': 'onSave'
    },

    initialize: function(options) {
      this.model = this.model || new ContactUs();

      this.listenTo(this.model, 'sync', function(model, options) {
        this.$el.find(this.alertSelector).addClass('hide');
        this.$el.find(this.submitSelector).removeClass('hide');
        this.$el.find(this.submitSelector).addClass('disabled');
        this.$el.find(this.submitSelector).text('Submitted!');
      });

      // For server side errors, show a generic bootstrap alert
      this.listenTo(this.model, 'error', function(model, options) {
        this.$el.find(this.alertSelector).removeClass('hide');
      });
    },

    fieldMap: {
      name: '.contact-us-form .contact-us-name',
      email: '.contact-us-form .contact-us-email',
      message: '.contact-us-form .contact-us-message'
    }
  });
});