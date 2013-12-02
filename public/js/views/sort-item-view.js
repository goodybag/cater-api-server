var SortItemView = Backbone.View.extend({
  events: {
    'sorted': 'onSorted'
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

, isSelected: function() {
    return this.$el.find('.item-checkbox').is(":checked");
  }

, moveTo: function(category) {
    this.category = category;
    this.$el.appendTo(this.category.$el);
    this.model.set('category_id', category.model.id);
    this.category.items.push(this);
  }

, updateOrder: function(event, order) {
    event.stopPropagation();
    this.model.set('order', order);
  }

, onSorted: function(event, ui) { // passing in a jquery sortable stop event's args
    event.stopPropagation();
    this.resort();
    this.category.showSaveItemsButton();
  }

, resort: function() {
    this.category.$el.find('.item').each(function(index, element) {
      $(element).trigger('update-order', index+1);
    });
  }

, save: function() {
    if (!this.model.unsavedAttributes()) return;

    this.model.save(this.model.unsavedAttributes(), {
      patch: true
    });
  }
});