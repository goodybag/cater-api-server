define(function(require, exports, module) {
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var utils = require('utils');

  var template = Handlebars.partials.order_params_bar;

  return module.exports = Backbone.View.extend({
    events: {
      'submit form':                'onFormSubmit'
    , 'click .form-group':          'focusInputs'
    , 'click .btn-search':          'onSearchClick'
    , 'keyup input':                'onInputChange'
    , 'blur input':                 'onInputChange'
    , 'change [name="order_type"]': 'onInputChange'
    }

  , template: template

  , initialize: function( options ) {
      this.options = options;

      this.initDatePickers();

      this.model.on( 'change:order_type', this.render, this );
      this.model.on( 'change', this.updateSearchHref, this );

      this.render();
    }

  , render: function(){
      var orderParams = {};

      if ( this.options.orderModel ){
        utils.extend( orderParams, this.options.orderModel.toJSON() );
      }

      utils.extend( orderParams, this.model.toJSON() );

      var $el = $( this.template({
        orderParams: orderParams
      }));

      this.$el.html( $el.html() );

      this.initDatePickers();

      return this;
    }

  , initDatePickers: function(){
      this.datepicker = this.$el.find("input[name='date']").eq(0).pickadate({
        format: 'mm/dd/yyyy'
      , min: new Date()
      }).pickadate('picker');

      this.timepicker = this.$el.find("input[name='time']").eq(0).pickatime({
        format: 'h:i A'
      , interval: 15
      }).pickatime('picker');

      this.timepicker.on( 'open', _(this.onTimePickerOpen).bind(this) );
    }

  , focusInputs: function(e) {
      // give focus to inputs when clicking icons, text, etc
      e.stopPropagation();
      $(e.target).find('input').focus();
    }

  , getProps: function(){
      return {
        order_type: this.$el.find('[name="order_type"]').val()
      , zip:        this.$("input[name='zip']").val() || null
      , date:       (this.datepicker.get()) ? utils.dateTimeFormatter(this.datepicker.get()) : null
      , time:       this.timepicker.get()
      , guests:     +this.$("input[name='guests']").val() || null
      };
    }

  , search: function() {
      this.trigger('params:submit');
    }

  , updateSearchHref: function(){
      this.$el.find('.btn-search').attr(
        'href', '/restaurants' + utils.queryParams( this.model.toJSON() )
      );
    }

  , onSearchClick: function(e){
      e.preventDefault();
      this.search();
    }

  , onFormSubmit: function (e) {
      this.search();
    }

  , onTimePickerOpen: function (e) {
      // Scroll to 8am
      var $el = this.timepicker.$root.find('.picker__holder');
      $el[0].scrollTop = $el.find('[data-pick="' + (60 * 8) + '"]')[0].offsetTop;
    }

  , onInputChange: function (e) {
    console.log("change", e.target.name, e.target.value)
      this.model.set(
        e.target.name
        // If it's a picker, then use the picker interface to get the value
      , [ 'date', 'time' ].indexOf( e.target.name ) > -1
          ? this[ e.target.name + 'picker' ].get() : e.target.value
      );
    }
  });
});