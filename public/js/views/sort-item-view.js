var SortItemView = Backbone.View.extend({
  events: {
    'sorted': 'sorted'
  , 'update-order': 'updateOrder'
  }

, initialize: function(options) {
    this.template = options.template || null;
    this.category = options.category || null; // category view

    this.listenTo(this.model, 'change', this.render);
  }

, render: function() {
    this.$el.replaceWith(this.template(this.model.toJSON()));
    return this;
  }

, updateOrder: function(event, order) {
    this.model.set('order', order);
  }

, sorted: function(event, ui) { // passing in a jquery sortable stop event's args
    var self = this;
    this.category.$el.find('.item').each(function(index, item) {
      $(item).trigger('update-order', index+1);
    });
    this.category.showSaveItemsButton();
  }

, save: function() {
    if (!this.model.hasChanged()) return;

    var data = {
      order: this.model.get('order')
    , category_id: this.model.get('category_id')
    };

    this.model.save(data, {
      patch: true
    });
  }
});
