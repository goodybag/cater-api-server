var OrderParamsModal = Backbone.View.extend({
  events: {
    'submit form': 'submit'
  },

  submit: function(e) {
    e.preventDefault();

    var blank = _.filter($el.find('form input'), function(input) { return $(input).val() === '' });
    if (blank.length > 0) {
      blank.addClass('has_error');
      this.$el.find('.alert-danger').removeClass('hide');
      return;
    }

    var login = {
      email: this.$el.find('input.email').val().trim(),
      password: this.$el.find('input.password').val().trim()
    };

    var orderParams = {
      zip: this.$el.find('input.zip').val().trim(),
      guests: this.$el.find('input.guests').val().trim(),
      date: this.$el.find('input.date').val().trim(),
      time: this.$el.find('input.time').val().trim()
    };

    var done = _.after(2, function() { window.location.reload(); });

    $.post('/session', login, done);
    this.model.save(orderParams, {success: done});
  }
});
