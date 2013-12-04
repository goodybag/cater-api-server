ItemView = Backbone.View.extend({
  events: {
    'click': 'showModal'
  },

  showModal: function() {
    this.options.itemModalView.provideModel(this.model).show();
  }
});
