var EditCategoryView = FormView.extend({
  events: {
    'click .new-item': 'newItem',
    'keyup .category-form .form-control': 'onChange',
    'change .category-form .form-control': 'onChange',
    'click .category-form .category-remove': 'onRemove',
    'submit .category-form': 'onSave'
  },

  initialize: function(options) {
    this.items = [];
    this.listenTo(this.model.items, 'sort', this.sortItems, this);
  },

  remove: function() {
    _.invoke(this.items, 'remove');
    FormView.prototype.remove.apply(this, arguments);
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

  onRemove: function(e) {
    var view = this;
    this.model.destroy({
      success: function(model, response, options) {
        view.remove();
      }
    });
  },

  // TODO: consider extracting to superclass
  onSave: function(e) {
    e.preventDefault();
    this.clearErrors();
    var view = this;
    var sent = this.model.save(this.getDiff(), {
      patch: true,
      singleError: false,
      success: function(model, response, options) {
        view.$el.find('.category-form .category-save').addClass('hide');
      }
    });

    if (!sent) this.displayErrors();
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
