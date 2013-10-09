var OrderParamsView = Backbone.View.extend({
  events: {
    'submit form':        'onFormSubmit'
  , 'click .form-group':  'focusInputs'
  , 'click .btn-search':  'onSearchClick'
  , 'keyup input':        'onInputChange'
  }

, initialize: function() {
    // the OrderParams model should be passed in
    // the el should also be passed in
    this.listenTo(this.model, 'change', this.updateFields, this);

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
  }

, focusInputs: function(e) {
    // give focus to inputs when clicking icons, text, etc
    e.stopPropagation();
    $(e.target).find('input').focus();
  }

, updateFields: function(model, value, options) {
    for (var key in model.changed) {
       // date
      if(key == 'date' && model.changed[key]){
        var date = dateTimeFormatter(model.changed[key], 'MM/DD/YYYY');
        this.$el.find('input[name=' + key + ']').val(date);
        continue;
      }

      // time
      if(key == 'time' && model.changed[key]){
        var time = timeFormatter(model.changed[key], 'h:mm A');
        this.$el.find('input[name=' + key + ']').val(time);
        continue;
      }

      // otherwise
      this.$el.find('input[name=' + key + ']').val(model.changed[key]);
    }
  }

, getProps: function(){
    return {
      zip: this.$("input[name='zip']").val() || null
    , date: (this.datepicker.get()) ? dateTimeFormatter(this.datepicker.get()) : null
    , time: this.timepicker.get()
    , guests: this.$("input[name='guests']").val() || null
    };
  }

, updateSearchHref: function(){
    this.$searchBtn.attr( 'href',  utils.queryParams( this.getProps() ) );
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
