var EditCategoryView = FormView.extend({
  events: {
    'click .new-item': 'newItem'
  },

  newItem: function(e) {
    var itemModel = new Item({category_id: this.model.id}, {category: this.model})
    var itemView = new EditItemView({model: itemModel, category: this});

    this.model.items.add(itemModel);
    this.items.push(itemView);

    itemView.render().attach();
  }
});
