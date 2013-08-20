var OrderParamsModal = Backbone.View.extend({
  events: {
    'submit form': 'submit',
    'click button[data-dismiss="modal"]': 'hide'
  },

  show: function() {
    this.clear();
    this.$el.modal('show');
  },

  hide: function() {
    this.$el.modal('hide');
  },

  clear: function() {
    this.$el.find('input').parent().removeClass('has-error');
    this.$el.find('.alert-danger').addClass('hide');
  },

  submit: function(e) {
    e.preventDefault();

    this.clear();

    var blank = this.$el.find('form input').filter(function(index) { return $(this).val() === '' });
    if (blank.length > 0) {
      blank.parent().addClass('has-error');
      this.$el.find('.alert-danger').removeClass('hide');
      return;
    }

    var done = _.after(this.options.loginNeeded + this.options.orderParamsNeeded, function() { window.location.reload(); });

    if (this.options.loginNeeded) {
      var login = {
        email: this.$el.find('input.email').val().trim(),
        password: this.$el.find('input.password').val().trim()
      };
      $.post('/session', login, done);
    }

    if (this.options.orderParamsNeeded) {
      var orderParams = {
        zip: this.$el.find('input.zip').val().trim(),
        guests: this.$el.find('input.guests').val().trim(),
        date: this.$el.find('input.date').val().trim(),
        time: this.$el.find('input.time').val().trim()
      };
      this.model.save(orderParams, {success: done});
    }


  }
});
