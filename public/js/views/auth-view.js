var AuthView = Backbone.View.extend({
  events: {
    'click .top-form-toggle': 'toggleTopForm',
    'keyup .top-form input[type="email"]': 'mirrorEmails'
  },

  toggleTopForm: function(e) {
    e.preventDefault();
    this.$el.find('form.top-form').toggleClass('hide');
  },

  mirrorEmails: function(e) {
    this.$el.find('.top-form input[type="email"]').val(e.currentTarget.value);
  }
});
