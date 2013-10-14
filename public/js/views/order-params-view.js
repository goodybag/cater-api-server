var OrderParamsView = Backbone.View.extend({
  events: {
    'submit form':        'onFormSubmit'
  , 'click .form-group':  'focusInputs'
  , 'click .btn-search':  'onSearchClick'
  , 'keyup input':        'onInputChange'
  }

, template: Handlebars.partials.order_params_view

, searchUrl: '/restaurants'

, initialize: function() {
    this.onInputChange = _.debounce( _.bind( this.updateSearchHref, this ), 300 );

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

    this.$searchBtn = this.$el.find('.btn-search');

    this.updateSearchHref();
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
      zip:    this.$("input[name='zip']").val() || null
    , date:   (this.datepicker.get()) ? dateTimeFormatter(this.datepicker.get()) : null
    , time:   this.timepicker.get()
    , guests: this.$("input[name='guests']").val() || null
    };
  }

, updateSearchHref: function(){
    this.$searchBtn.attr( 'href',  this.searchUrl + utils.queryParams( this.getProps() ) );
    return this;
  }

, onSearchClick: function(e){
    this.updateSearchHref();
  }

, onFormSubmit: function (e) {
    e.preventDefault();
    this.$searchBtn.trigger('click');
  }
});
