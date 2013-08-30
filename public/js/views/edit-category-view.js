var EditCategoryView = FormView.extend({
  tagName: 'div',

  className: 'panel',

  submitSelector: '.category-form .category-save',

  template: Handlebars.partials.edit_category,

  events: {
    'click .new-item': 'newItem',
    'keyup .category-form .form-control': 'onChange',
    'change .category-form .form-control': 'onChange',
    'click .category-form .category-remove': 'onRemove',
    'submit .category-form': 'onSave'
  },

  initialize: function(options) {
    this.restaurant = options.restaurant;
    if (this.model == null) this.model = new Category({restaurant_id: this.restaurant.model.id}, {restaurant: this.model});
    if (this.model.id) this.id = 'category-' + this.model.id;
    this.items = [];
    this.listenTo(this.model.items, 'sort', this.sortItems, this);
  },

  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    if (this.model.isNew() || this.getDiff())
      this.$el.find(submitSelector).removeClass('hide');
    return this;
  },

  attach: function() {
    this.$el.hide();
    this.delegeateEvents();
    this.restaurant.$el.append(this.$el);
    this.$el.fadeIn();
    return this;
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

  onRemove: function(e) {
    var view = this;
    this.model.destroy({
      success: function(model, response, options) {
        view.remove();
      }
    });
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
