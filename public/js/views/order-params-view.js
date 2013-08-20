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
    for (var key in model.changed)
      this.$el.find('input[name=' + key + ']').val(model.changed[key]);
  }
, submit: function (e) {
    e.preventDefault();

    var form = {
      zip: this.$("input[name='zip']").val()
    , date: this.$("input[name='date']").val()
    , time: this.$("input[name='time']").val()
    , guests: this.$("input[name='guests']").val()
    };

    this.model.save(form);
  }
});
