var OrderParamsModal = Backbone.View.extend({
  events: {
    'submit form': 'submit',
    'click button[data-dismiss="modal"]': 'hide'
  },

  initialize: function() {
    this.datepicker = this.$el.find("input.date").eq(0).pickadate({
      format: 'mm/dd/yyyy'
    , min: new Date()
    }).pickadate('picker');

    this.timepicker = this.$el.find("input.time").eq(0).pickatime({
      format: 'hh:i A'
    , interval: 15
    }).pickatime('picker');
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

       // date
      if (key == 'date' && this.model.get(key) && $input) {
        var date = dateTimeFormatter(this.model.get(key), 'MM/DD/YYYY');
        $input.val(date);
        continue;
      }

      // time
      if (key == 'time' && this.model.get(key)  && $input) {
        var time = timeFormatter(this.model.get(key), 'hh:mm A');
        $input.val(time);
        continue;
      }

      // otherwise
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
        date: (this.datepicker.get()) ? dateTimeFormatter(this.datepicker.get()) : null,
        time: (this.timepicker.get()) ? timeFormatter(this.timepicker.get()) : null
      };
      this.model.save(orderParams, {success: done});
    }
  }
});
