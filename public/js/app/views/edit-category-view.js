define(function(require, exports, module) {
  var Handlebars = require('handlebars');
  var FormView = require('./form-view');
  var EditItemView = require('./edit-item-view');
  var Category = require('../models/category');
  var Item = require('../models/item');

  var EditCategoryView = FormView.extend({
    tagName: 'div',

    className: 'panel',

    submitSelector: '.category-form .category-save',

    template: Handlebars.partials.edit_category,

    events: {
      'click .category-copy': 'copyCategory',
      'click .new-item': 'newItem',
      'keyup .category-form .form-control': 'onChange',
      'change .category-form .form-control': 'onChange',
      'change .category-form input': 'onChange',
      'click .category-form .category-remove': 'onRemove',
      'submit .category-form': 'onSave'
    },

    initialize: function(options) {
      this.restaurant = options.restaurant;
      if (this.model == null) this.model = new Category({restaurant_id: this.restaurant.model.id}, {restaurant: this.model});
      if (this.model.id) this.id = 'category-' + this.model.id;
      this.items = [];
      this.listenTo(this.model.items, 'sort', this.sortItems, this);

      this.on('save:success', function(model, res) {
        var $newBtn = this.$el.find('.new-item');
        $newBtn.attr('style', 'display: inline-block').show();
      });
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      if (this.model.isNew() || this.getDiff())
        this.$el.find(this.submitSelector).removeClass('hide');
      return this;
    },

    attach: function() {
      this.$el.hide();
      this.delegateEvents();
      this.restaurant.$el.find('.categories').append(this.$el);
      this.$el.stop(true, true).fadeIn();
      _.invoke(this.items, 'attach');
      return this;
    },

    remove: function() {
      _.invoke(this.items, 'remove');
      FormView.prototype.remove.apply(this, arguments);
    },

    fieldMap: {
      name: '.category-form .category-name',
      description: '.category-form .category-description',
      order: '.category-form .category-order',
      menus: '.category-form .category-menus',
      is_hidden: '.category-form .category-is-hidden'
    },

    fieldGetters: {
      order: function() {
        var val = this.$el.find(this.fieldMap.order).val().trim();
        return val ? parseInt(val) : null;
      },
      menus: function() {
        return _.pluck(this.$el.find(this.fieldMap.menus + ':checked'), 'value');
      },
      is_hidden: function() {
        return this.$el.find(this.fieldMap.is_hidden).is(':checked');
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

    copyCategory: function (e) {
      var self = this;
      var categoryModel = new Category(this.model.omit(['id', 'created_at']), {restaurant: this.model.restaurant});
      categoryModel.set('order', categoryModel.get('order') + 1);
      var categoryView = new EditCategoryView({model: categoryModel, restaurant: this.restaurant});
      categoryModel.save({}, {
        success: function (model, response, options) {
          self.restaurant.categories.push(categoryView);
          self.restaurant.model.categories.add(categoryView.model, {sort: false});
          categoryView.render().attach();

          _(self.items).each(function(item){
            var itemModel = new Item(item.model.omit(['id', 'created_at', 'category_id']), {category: categoryModel});
            categoryModel.items.add(itemModel);

            var itemView = new EditItemView({model: itemModel, category: categoryView});
            categoryView.items.push(itemView);

            itemView.render().attach();
            itemView.onSave();
          });
        },
        error: function (model, xhr, options) {
          alert("We're sorry, there was an error trying to copy this category");
        }
      })
    },

    sortItems: function(collection, options) {
      this.items = _.sortBy(this.items, function(itemView) {
        return itemView.model.get('order');
      });

      _.invoke(this.items, 'remove');
      _.invoke(this.items, 'attach');
    }
  });

  return module.exports = EditCategoryView;
});
