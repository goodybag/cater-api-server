var CreateUserView = FormView.extend({
  submitSelector: '.create-user-form .create-user-submit',

  events: {
    'submit .create-user-form': 'onSave'
  },

  initialize: function(options) {
    this.model = this.model || new CreateUser();

    this.listenTo(this.model, 'sync', function(model, options) {
      this.$el.find(this.submitSelector).removeClass('hide');
    });

    this.listenTo(this.model, 'error', function(model, options) {
      console.log('errror');
    });
  },

  fieldMap: {
    email: '.create-user-form .create-user-email'
  , password: '.create-user-form .create-user-password'
  , first_name: '.create-user-form .create-user-first-name'
  , last_name: '.create-user-form .create-user-last-name'
  , organization: '.create-user-form .create-user-organization'
  , group: '.create-user-form .create-user-group:checked'
  }
});