var OrderParamsModal = Backbone.View.extend({
  events: {
    'submit form': 'submit',
    'click button[data-dismiss="modal"]': 'hide'
  },

  show: function() {
    this.clear();
    this.fillFields();
    this.$el.find('form fieldset.order-params-fieldset').toggleClass('hide', this.model.isComplete());
    this.$el.modal('show');
  },

  hide: function() {
    this.$el.modal('hide');
  },

  clear: function() {
    this.$el.find('input').parent().removeClass('has-error');
    this.$el.find('.alert-danger').addClass('hide');
  },

  fillFields: function() {
    for (var key in this.model.toJSON()) {
      var $input = this.$el.find('form input.' + key);
      if ($input) $input.val(this.model.get(key));
    }
  },

  submit: function(e) {
    e.preventDefault();

    this.clear();

    var blank = this.$el.find('form input:visible').filter(function(index) { return $(this).val() === '' });
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
        zip: this.$el.find('input.zip').val().trim() || null,
        guests: this.$el.find('input.guests').val().trim() || null,
        date: this.$el.find('input.date').val().trim() || null,
        time: this.$el.find('input.time').val().trim() || null
      };
      this.model.save(orderParams, {success: done});
    }


  }
});
