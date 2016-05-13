define(function(require, exports, module) {
  var Backbone = require('backbone');
  var utils = require('utils');
  var venter = require('venter');
  var config = require('config');

  // Fulfillability errors we should ignore when preventing
  // the user from submitting params
  var errorsToIgnore = [
    'MinimumOrder'
  ];

  return module.exports = Backbone.View.extend({
    events: {
      'submit form': 'submit',
      'click .btn-submit': 'submit',
      'click button[data-dismiss="modal"]': 'hide',
      'keyup input': 'onKeyUp'
    },

    // handle events from model.save on submit
    submitHandlers: {},

    initialize: function( options ) {
      utils.enforceRequired( options, [
        'orderModel', 'restaurant'
      ]);

      this.datepicker = this.$el.find('input[name="date"]').eq(0).pickadate({
        format: 'mm/dd/yyyy'
      , min: new Date()
      }).pickadate('picker');

      this.datepicker.on( 'set', _(this.onDatePickerSet).bind( this ) );
      this.datepicker.on( 'open', _(this.onDatePickerOpen).bind( this ) );

      this.timepicker = this.$el.find('input[name="time"]').eq(0).pickatime({
        format: 'hh:i A'
      , interval: 15
      }).pickatime('picker');

      this.timepicker.on( 'set', _(this.onTimePickerSet).bind( this ) );
      this.timepicker.on( 'open', _(this.onTimePickerOpen).bind( this ) );

      // Remove the paneliness from the order params partial
      this.$el.find('.order-params-bar').removeClass('panel');

      // Handle discrepancy between pickadates and moments formatting
      this.timepickerMomentFormat = this.timepicker.component.settings.format.replace( /\i/g, 'mm' );

      venter.on('open:order-params', this.openOrderParams, this);
    },

    openOrderParams: function() {
      this.show({
        success: function(model) { this.hide(); }.bind(this)
        , error: function(){ alert('sorry we were unable to change your order information, please refresh page and try again'); }
      });
    },

    show: function(submitHandlers) {
      this.submitHandlers = submitHandlers || {};

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

    showErrors: function( errors ){
      this.clear();

      var errors = errors || []
        .concat(
          this.model.validateOrderFulfillability({ omit: ['MinimumOrder'] })
        , this.model.validateRestaurantEvents()
        , this.model.validateAfterHours()
        )
        .filter( function( error ){
          return errorsToIgnore.indexOf( error ) === -1;
        });

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
          var date = utils.dateTimeFormatter(this.model.get(key), 'MM/DD/YYYY');
          this.$el.find('[name="date"]').val( utils.dateTimeFormatter(this.model.get(key), 'MM/DD/YYYY') );
          this.$el.find('[name="time"]').val( utils.dateTimeFormatter(this.model.get(key), 'h:mm A') );
          continue;
        }

        // zip
        if (key == 'zip' && this.model.address.get(key)) {
          this.$el.find('[name="zip"]').val( this.model.address.get(key) );
          continue;
        }

        var $input = this.$el.find('[name="' + key + '"]');

        // otherwise
        if ($input) $input.val(this.model.get(key));
      }
    },

    getParams: function(){
      var order = {
        zip: this.$el.find('input[name="zip"]').val().trim() || null,
        guests: parseInt(this.$el.find('input[name="guests"]').val()) || null,
        datetime: !this.datepicker.get() ? null : (
          utils.dateTimeFormatter(this.datepicker.get()) + " " + (
            !this.timepicker.get() ? "" : utils.timeFormatter(this.timepicker.get())
          )
        )
      };

      // If the orderParams zip is the same as user's default zip
      // Go ahead and autofill with default address
      if (order.zip === this.options.defaultAddress.get('zip'))
        _.extend(order, this.options.defaultAddress.pick(this.model.constructor.addressFields));

      return order;
    },

    updateParams: function () {
      this.model.set( this.getParams() );
    },

    submit: function(e) {
      e.preventDefault();

      if ( this.isLoading ) return;

      this.clear();

      var blank = this.$el.find('form input:visible').filter(function(index) { return $(this).val() === ''; });
      if (blank.length > 0) {
        blank.parent().addClass('has-error');
        this.$el.find('.error-blank-fields').removeClass('hide');
        return;
      }

      this.updateParams();

      if ( this.showErrors() ) return;

      this.isLoading = true;

      var self = this;
      var jqxhr = this.model.save( this.model.isNew() ? null : this.getParams(), {
        // We've already done validation ourselves
        validate: false
      , patch: true
      });

      if ( !jqxhr ){
        return this.showErrors(['unknown']);
      }

      jqxhr.success(function(){
        self.model.trigger('change:orderparams');
        if ( self.submitHandlers.success ){
          self.submitHandlers.success( self.model );
        }

        self.isLoading = false;
      }).error( function(){
        if ( self.submitHandlers.error ){
          self.submitHandlers.error.apply( self, arguments );
        }

        self.isLoading = false;
      });
    },

    onDatePickerSet: function() {
      this.updateParams();
    },

    onDatePickerOpen: function(){
      this.datepicker.set( 'disable', this.options.restaurant.getDaysClosed() );
    },

    /**
     * Converts the timepicker times from regla-ass times to ranges
     */
    convertTimesToRanges: function(){
      var timeFormat = this.timepickerMomentFormat;

      this.timepicker.$root.find('.picker__list-item').each( function(){
        var $this = $(this);
        var range = utils.timeToRange( $this.text(), timeFormat, config.deliveryTime );
        $this.text( range.join(' - ') );
      });
    },

    setTimeRangeInput: function( time, format ){
      var range = utils.timeToRange( time, format, config.deliveryTime );
      this.$el.find('[name="time-range"]').val( range.join(' - ') );
    },

    onTimePickerSet: function( ctx ){
      if ( 'select' in ctx ){
        this.setTimeRangeInput(
          this.timepicker.get()
        , this.timepickerMomentFormat
        );
      }

      this.updateParams();
    },

    onTimePickerOpen: function(){
      var day = this.datepicker.get();

      // Build a disabled set of values that matches timepickers format
      var disabled = [];
      for (var i = 0; i < 24; ++i){
        disabled.push( [ i, 0  ] );
        disabled.push( [ i, 15 ] );
        disabled.push( [ i, 30 ] );
        disabled.push( [ i, 45 ] );
      }

      // Initially reset everything
      this.timepicker.set( 'enable', disabled );

      // Don't do anything if we haven't already selected a day
      if ( !day ) return;

      day = new Date( day ).getDay();

      var times = this.options.orderModel.restaurant.get('delivery_times')[ day ];
      times = times.concat( this.options.orderModel.restaurant.get('hours_of_operation')[ day ] );

      this.timepicker.set(
        'disable'
        // Filter the times down to the ones that should be disabled
      , _(disabled).filter( function( t ){
          // Pad the hh:mm
          var time = [
            ( '0' + t[0] ).slice( -2 )
          , ( '0' + t[1] ).slice( -2 )
          , '00'
          ].join(':');

          // Check that `time` is out of bounds for every delivery_time for the day picked
          return _(times).every( function( t ){
            return time < t[ 0 ] || time > t[ 1 ];
          });
        })
      );

      this.convertTimesToRanges();
    }

  , onKeyUp: function( e ){
      // Enter they intended to submit
      if ( e.keyCode === 13 ){
        this.submit( e );
      }
    }
  });
});
