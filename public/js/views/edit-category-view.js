var EditCategoryView = FormView.extend({
  events: {
    'click .new-item': 'newItem',
    'keyup .category-form .form-control': 'onChange',
    'change .category-form .form-control': 'onChange'
  },

  initialize: function(options) {
    this.items = [];
    this.listenTo(this.model.items, 'sort', this.sortItems, this);
  },

  fieldMap: {
    name: '.category-form .category-name',
    description: '.category-form .category-description',
    order: '.category-form .category-order'
  },

  fieldGetters: {
    order: function() {
      var val = this.$el.find(this.fieldMap.order).val().trim();
      return val ? parseInt(val) : null;
    }
  },

  onChange: function(e) {
    this.$el.find('.category-form .category-save').toggleClass('hide', !this.getDiff());
  },

  newItem: function(e) {
    var itemModel = new Item({category_id: this.model.id}, {category: this.model})
    var itemView = new EditItemView({model: itemModel, category: this});

    this.model.items.add(itemModel, {sort: false});
    this.items.push(itemView);

    itemView.render().attach();
  },

  sortItems: function(collection, options) {
    this.items = _.sortBy(this.items, function(itemView) {
      return itemView.model.get('order');
    });

    _.invoke(this.items, 'remove');
    _.invoke(this.items, 'attach');
  }
});
