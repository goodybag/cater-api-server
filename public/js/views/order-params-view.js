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
      zip: this.$("input[name='zip']").val() || null
    , date: this.$("input[name='date']").val() || null
    , time: this.$("input[name='time']").val() || null
    , guests: this.$("input[name='guests']").val() || null
    };
    this.model.save(form, {
      success: function(model, response, options) {
        window.location.reload();
      }
    });
  }
});
