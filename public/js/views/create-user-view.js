var CreateUserView = FormView.extend({
  submitSelector: '.create-user-form .create-user-submit',

  events: {
    'submit .create-user-form': 'onSave',
    'keyup .create-user-form': 'onChange'
  },

  /* Show a flash message on the submit button */
  flashSubmitMessage: function(msg, timeout) {
    var this_ = this;

    this.$submit.removeClass('hide btn-primary');
    this.$submit.addClass('btn-info');
    this.$submit.text(msg);

    setTimeout(function() {
      this_.$submit.addClass('hide btn-primary');
      this_.$submit.removeClass('btn-info');
      this_.$submit.text('Create User');
    }, timeout || 3000);
  },

  initialize: function(options) {
    this.model = this.model || new User();

    this.$submit = this.$el.find(this.submitSelector);

    this.listenTo(this.model, 'sync', function(model, options) {
      this.flashSubmitMessage('User created successfully!');
    });

    this.listenTo(this.model, 'error', function(model, options) {
      this.flashSubmitMessage(options.responseJSON.error.message);
    });
  },

  fieldMap: {
    email: '.create-user-form .create-user-email'
  , password: '.create-user-form .create-user-password'
  , first_name: '.create-user-form .create-user-first-name'
  , last_name: '.create-user-form .create-user-last-name'
  , organization: '.create-user-form .create-user-organization'
  , groups: '.create-user-form .create-user-group:checked'
  }
});