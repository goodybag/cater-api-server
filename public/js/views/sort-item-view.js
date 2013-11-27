var SortItemView = Backbone.View.extend({
  events: {
    'sorted': 'sorted'
  , 'update-order': 'updateOrder'
  }

, initialize: function(options) {
    this.template = options.template;
    this.category = options.category; // category view
    this.listenTo(this.model, 'change', this.render);
  }

, render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  }

, updateOrder: function(event, order) {
    event.stopPropagation();
    this.model.set('order', order);
  }

, sorted: function(event, ui) { // passing in a jquery sortable stop event's args
    event.stopPropagation();
    this.category.$el.find('.item').each(function(index, element) {
      $(element).trigger('update-order', index+1);
    });
    this.category.refreshSortable();
    this.category.showSaveItemsButton();
  }

, save: function() {
    if (!this.model.unsavedAttributes()) return;

    this.model.save(this.model.unsavedAttributes(), {
      patch: true
    });
  }
});
