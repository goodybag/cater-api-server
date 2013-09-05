var ContactUsView = FormView.extend({
  submitSelector: '.contact-us-form .contact-us-send',
  alertSelector: '.contact-us-container .contact-us-alert',

  events: {
    'submit .contact-us-form': 'onSave'
  },

  initialize: function(options) {
  },

  fieldMap: {
    name: '.contact-us-form .contact-us-name',
    email: '.contact-us-form .contact-us-email',
    message: '.contact-us-form .contact-us-message'
  },

  onSave: function(e) {
    e.preventDefault();
    this.clearErrors();
    var view = this;
    var sent = this.model.save(this.getDiff() || {}, {
      patch: true,
      wait: true,
      singleError: false,
      success: function(model, response, options) {
        view.$el.find(view.submitSelector).text('Submitted!');
        view.$el.find(view.submitSelector).addClass('disabled');
      },
      error: function(model, response, options) {
        view.$el.find(view.alertSelector).show();
      }
    });

    if (!sent) this.displayErrors();
  }
});