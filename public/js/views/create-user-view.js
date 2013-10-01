var CreateUserView = FormView.extend({
  submitSelector: '.create-user-form .create-user-submit',
  //alertSelector: '.contact-us-container .contact-us-alert',

  events: {
    'submit .create-user-form': 'onSave'
  },

  initialize: function(options) {
    this.model = this.model || new CreateUser();

    // this.listenTo(this.model, 'sync', function(model, options) {
    //   this.$el.find(this.alertSelector).addClass('hide');
    //   this.$el.find(this.submitSelector).removeClass('hide');
    //   this.$el.find(this.submitSelector).addClass('disabled');
    //   this.$el.find(this.submitSelector).text('Submitted!');
    // });

    // For server side errors, show a generic bootstrap alert
    // this.listenTo(this.model, 'error', function(model, options) {
    //   this.$el.find(this.alertSelector).removeClass('hide');
    // });

    this.listenTo(this.model, 'error', function(model, options) {
      console.log("error");
    });
  },

  fieldMap: {
    email: '.create-user-form .create-user-email',
    password: '.create-user-form .create-user-password'
  }
});