define(function(require, exports, module) {
  require('pickadate');
  require('pickatime');

  var Backbone = require('backbone');
  var template = require('hbs!/partials/order-params-bar')

  return module.exports = Backbone.View.extend({
    events: {
      'submit form':        'onFormSubmit'
    , 'click .form-group':  'focusInputs'
    , 'click .btn-search':  'onSearchClick'
    , 'keyup input':        'onInputChange'
    }

  // , template: Handlebars.partials.order_params_view
  , template: function() {}

  , initialize: function() {

      this.datepicker = this.$el.find("input[name='date']").eq(0).pickadate({
        format: 'mm/dd/yyyy'
      , min: new Date()
      }).pickadate('picker');

      this.timepicker = this.$el.find("input[name='time']").eq(0).pickatime({
        format: 'h:i A'
      , interval: 15
      }).pickatime('picker');

      this.datepicker.on( 'set', this.onInputChange );
      this.timepicker.on( 'set', this.onInputChange );
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
      return {
        zip:      this.$("input[name='zip']").val() || null
      , date:     (this.datepicker.get()) ? dateTimeFormatter(this.datepicker.get()) : null
      , time:     this.timepicker.get()
      , guests:   this.$("input[name='guests']").val() || null
      };
    }

  , search: function() {
      this.trigger('params:submit');
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
  });
});