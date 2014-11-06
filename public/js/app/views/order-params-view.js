define(function(require, exports, module) {
  var Backbone    = require('backbone');
  var Handlebars  = require('handlebars');
  var moment      = require('moment');
  var config      = require('config');
  var utils       = require('utils');

  var template = Handlebars.partials.order_params_bar;

  return module.exports = Backbone.View.extend({
    events: {
      'submit form':                'onFormSubmit'
    , 'click .form-group':          'focusInputs'
    , 'click .btn-search':          'onSearchClick'
    , 'keyup input':                'onKeyUp'
    // , 'blur [name="time-range"]':   'onTimeRangeBlur'
    , 'focus [name="time-range"]':  'onTimeRangeFocus'
    }

  , template: template

  , initialize: function() {

      this.datepicker = this.$el.find("input[name='date']").eq(0).pickadate({
        format: 'mm/dd/yyyy'
      , min: new Date()
      }).pickadate('picker');

      window.$time = this.timepicker = this.$el.find("input[name='time']").eq(0).pickatime({
        format: 'h:i A'
      , interval: 15
      }).pickatime('picker');

      this.timepicker.on( 'set', _(this.onTimePickerSet).bind(this) );
      this.timepicker.on( 'open', _(this.onTimePickerOpen).bind(this) );
    }

  , render: function(){
      var $el = $( this.template({
        orderParams: utils.parseQueryParams()
      }));

      this.$el.html( $el.html() );

      return this;
    }

  , focusInputs: function(e) {
      // give focus to inputs when clicking icons, text, etc
      e.stopPropagation();
      $(e.target).find('input').focus();
    }

  , getProps: function(){
      var validDate = /\d{2}\/\d{2}\/\d{4}/.test( this.datepicker.get() );
      var validTime = /\d{1,2}:\d{2}\s(AM|PM)/.test( this.timepicker.get() );

      return {
        zip:      this.$("input[name='zip']").val() || null
      , date:     validDate ? utils.dateTimeFormatter(this.datepicker.get()) : null
      , time:     validTime ? this.timepicker.get() : null
      , guests:   this.$("input[name='guests']").val() || null
      };
    }

  , search: function() {
      this.trigger('params:submit');
    }

  , scrollTimeToTime: function( time ){
      // Scroll to 8am
      var $el = this.timepicker.$root.find('.picker__holder');
      $el[0].scrollTop = $el.find('[data-pick="' + (60 * time) + '"]')[0].offsetTop;
    }

    /**
     * Converts the timepicker times from regla-ass times to ranges
     */
  , convertTimesToRanges: function(){
      var timeFormat = 'hh:mm A';

      this.timepicker.$root.find('.picker__list-item').each( function(){
        var $this = $(this);
        var range = utils.timeToRange( $this.text(), timeFormat, config.deliveryTime );
        $this.text( range.join(' - ') );
      });
    }

  , onSearchClick: function(e){
      e.preventDefault();
      this.search();
    }

  , onFormSubmit: function (e) {
      this.search();
    }

  , onTimePickerOpen: function (e) {
      this.scrollTimeToTime(8);
      this.convertTimesToRanges();
    }

  , onTimePickerSet: function( ctx ){
      this.$el.find('[name="fake-time"]').val('poop');
      console.log(ctx, this.timepicker.get());
    }

  , onKeyUp: function( e ){
      // Enter they intended to submit
      if ( e.keyCode === 13 ){
        this.search();
      }
    }

  , onTimeRangeFocus: function( e ){
    e.preventDefault();
    console.log('open')
      this.timepicker.$node.focus();
      // this.timepicker.open();
    }

  , onTimeRangeBlur: function( e ){
    console.log('close')
      this.timepicker.close();
    }
  });
});