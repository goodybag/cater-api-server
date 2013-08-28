var EditCategoryView = View.extend({
  events: {
    'click .new-item': 'newItem'
  },

  newItem: function(e) {
    var itemModel = new Item({category_id: this.model.id}, {category: this.model})
    var itemView = new EditItemView({model: itemModel, category: this});
    itemView.render().attach();
    this.items.push(itemView);
  }
});
