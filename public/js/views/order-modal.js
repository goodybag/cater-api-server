var OrderModal = Backbone.View.extend({
  events: {
    'submit form': 'submit',
    'click .btn-submit': 'submit',
    'click button[data-dismiss="modal"]': 'hide'
  },

  initialize: function() {
    this.datepicker = this.$el.find('input[name="date"]').eq(0).pickadate({
      format: 'mm/dd/yyyy'
    , min: new Date()
    }).pickadate('picker');

    this.timepicker = this.$el.find('input[name="time"]').eq(0).pickatime({
      format: 'hh:i A'
    , interval: 15
    }).pickatime('picker');

    // Remove the paneliness from the order params partial
    this.$el.find('.order-params-bar').removeClass('panel');
  },

  show: function() {
    this.clear();
    this.showErrors();
    this.fillFields();
    this.$el.modal('show');
  },

  hide: function() {
    this.$el.modal('hide');
  },

  clear: function() {
    this.$el.find('input').parent().removeClass('has-error');
    this.$el.find('.alert').addClass('hide');
  },

  showErrors: function(){
    this.clear();

    var errors = this.model.validateOrderFulfillability();
    var this_ = this;

    _.each( errors, function( error ){
      this_.$el.find( '.alert.' + error ).removeClass('hide');
    });

    return errors.length > 0;
  },

  fillFields: function() {
    for (var key in this.model.toJSON()) {
       // date
      if (key == 'datetime' && this.model.get(key)) {
        var date = dateTimeFormatter(this.model.get(key), 'MM/DD/YYYY');
        this.$el.find('[name="date"]').val( dateTimeFormatter(this.model.get(key), 'MM/DD/YYYY') );
        this.$el.find('[name="time"]').val( dateTimeFormatter(this.model.get(key), 'hh:mm A') );
        continue;
      }

      var $input = this.$el.find('[name="' + key + '"]');

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
      this.$el.find('.error-blank-fields').removeClass('hide');
      return;
    }

    if (this.options.loginNeeded) {
      var login = {
        email: this.$el.find('input.email').val().trim(),
        password: this.$el.find('input.password').val().trim()
      };
      $.post('/session', login, done);
    }

    var order = {
      zip: this.$el.find('input[name="zip"]').val().trim() || null,
      guests: parseInt(this.$el.find('input[name="guests"]').val()) || null,
      datetime: !this.datepicker.get() ? null : (
        dateTimeFormatter(this.datepicker.get()) + " " + (
          !this.timepicker.get() ? "" : timeFormatter(this.timepicker.get())
        )
      )
    };

    this.model.set( order, { silent: true } );

    if ( this.showErrors() ) return;

    this.model.save( null, { success: function() { window.location.reload(); } });
  }
});
