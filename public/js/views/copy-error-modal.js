var CopyErrorModalView = Backbone.View.extend({
  events: {
    'click .btn-retry': 'retry'
  },

  setModel: function(model) {
    // stop listening to old model
    this.model = model;
    // set events on new model
  },

  retry: function(e) {
    var view = this;
    this.$el.one('hidden.bs.modal', function() {
      view.model.copy(view); // Step 2: when hide is done, copy.
    });
    this.$el.modal('hide');  // Step 1: hide modal
  }
});
