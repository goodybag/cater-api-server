var SortItemView = Backbone.View.extend({
  events: {
    'update-order': 'updateOrder'
  }

, initialize: function(options) {
    this.template = options.template;
    this.category = options.category; // category view
    this.listenTo(this.model, 'change:order', this.render);
  }

, render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  }

, isSelected: function() {
    return this.$el.find('.item-checkbox').is(":checked");
  }

, updateOrder: function(event, order) {
    event.stopPropagation();
    this.model.set('order', order);
  }

, save: function() {
    if (!this.model.unsavedAttributes()) return;

    this.model.save(this.model.unsavedAttributes(), {
      patch: true
    });
  }
});