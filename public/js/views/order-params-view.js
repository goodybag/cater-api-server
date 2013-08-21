var OrderParamsView = Backbone.View.extend({
  events: {
    'submit form': 'submit'
  , 'click .save': 'submit'
  }
, initialize: function() {
    // the OrderParams model should be passed in
    // the el should also be passed in
    this.listenTo(this.model, 'change', this.updateFields);
    this.model.fetch();
  }
, updateFields: function(orderParams) {
    this.$("input[name='zip']").val(orderParams.get('zip'));
    this.$("input[name='date']").val(orderParams.get('date'));
    this.$("input[name='time']").val(orderParams.get('time'));
    this.$("input[name='guests']").val(orderParams.get('guests'));
  }
, submit: function (e) {
    e.preventDefault();

    var form = {
      zip: this.$("input[name='zip']").val()
    , date: this.$("input[name='date']").val()
    , time: this.$("input[name='time']").val()
    , guests: this.$("input[name='guests']").val()
    }
    this.model.save(form, {
      success: function(model, response, options) {
        window.location.reload();
      }
    });
  }
});