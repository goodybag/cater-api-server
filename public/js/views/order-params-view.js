var OrderParamsView = Backbone.View.extend({
  events: {
    'submit form': 'submit'
  }
, initialize: function() {
    // the OrderParams model should be passed in
    // the el should also be passed in
    this.listenTo(this.model, 'change', this.updateFields, this);
  }
, updateFields: function(model, value, options) {
    for (var key in model.changed) {
      if(key == 'time' && model.changed[key]) {
        var time = moment(model.changed[key]);
        this.$el.find('input[name=' + key + ']').val(time.format('h:mm A'));
      } else {
        this.$el.find('input[name=' + key + ']').val(model.changed[key]);
      }
    }
  }
, submit: function (e) {
    e.preventDefault();

    // parse time and send ISOString
    var time = this.$("input[name='time']").val() || null;
    if (time) {
      try{
        var ampm = time.split(' ')[1].toLowerCase();
        var timeParts = time.split(' ')[0].split(':');

        if (ampm == 'pm') timeParts[0] = parseInt(timeParts[0])+12;
        time = moment();
        time.hour(timeParts[0]).minute(timeParts[1]).second(0).millisecond(0);
        time = time.toISOString();
      } catch(e) {
        console.log('invalid time');
        time = null;
      }
    }
    var form = {
      zip: this.$("input[name='zip']").val() || null
    , date: this.$("input[name='date']").val() || null
    , time: time || null
    , guests: this.$("input[name='guests']").val() || null
    };
    this.model.save(form, {
      success: function(model, response, options) {
        window.location.reload();
      }
    });
  }
});
