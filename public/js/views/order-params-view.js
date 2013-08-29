var OrderParamsView = Backbone.View.extend({
  events: {
    'submit form': 'submit'
  }
, initialize: function() {
    // the OrderParams model should be passed in
    // the el should also be passed in
    this.listenTo(this.model, 'change', this.updateFields, this);

    this.render();
  }

, render: function() {
    this.datepicker = this.$el.find("input[name='date']").eq(0).pickadate({
      format: 'mm/dd/yyyy'
    , min: new Date()
    }).pickadate('picker');

    this.timepicker = this.$el.find("input[name='time']").eq(0).pickatime({
      format: 'hh:i A'
    , interval: 15
    }).pickatime('picker');
  }

, updateFields: function(model, value, options) {
    for (var key in model.changed) {
       // date
      if(key == 'date' && model.changed[key]){
        var date = dateFormatter(model.changed[key], 'MM/DD/YYYY');
        this.$el.find('input[name=' + key + ']').val(date);
        continue;
      }

      // time
      if(key == 'time' && model.changed[key]){
        var time = timeFormatter(model.changed[key], 'hh:mm A');
        this.$el.find('input[name=' + key + ']').val(time);
        continue;
      }

      // otherwise
      this.$el.find('input[name=' + key + ']').val(model.changed[key]);
    }
  }

, submit: function (e) {
    e.preventDefault();

    var form = {
      zip: this.$("input[name='zip']").val() || null
    , date: (this.datepicker.get()) ? dateFormatter(this.datepicker.get()) : null
    , time: (this.timepicker.get()) ? timeFormatter(this.timepicker.get()) : null
    , guests: this.$("input[name='guests']").val() || null
    };
    this.model.save(form, {
      success: function(model, response, options) {
        window.location.reload();
      }
    });
  }
});
