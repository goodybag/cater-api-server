var SortCategoryView = Backbone.View.extend({

  events: {
    'item-moved': 'onItemMoved'
  , 'update-order': 'updateOrder'
  , 'click .toggle-items': 'toggleItemVisibility'
  , 'click .save-items': 'saveItems'
  , 'click .dropdown-category': 'moveSelectedItemsToCategory'
  }

, initialize: function(options) {
    this.items = [];
    this.areItemsVisible = true;
    this.template = options.template;
    this.menu = options.menu;

    this.listenTo(this.model, 'change', this.render);

    this.$category = this.$el.find('.category');

    this.$category.sortable({
      update: function(event, ui) {
        ui.item.trigger('item-moved', ui);
      }
    });
  }

, render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    this.renderItems();
    this.$category.sortable({
      update: function(event, ui) {
        ui.item.trigger('item-moved', ui);
      }
    });

    return this;
  }

, renderItems: function() {
    this.$category.empty();

    if (!this.areItemsVisible) this.$category.hide();

    this.items = _.sortBy(this.items, function(item) {
      return item.model.get('order');
    });

    for (var i=0, len=this.items.length; i<len; i++) {
      var view = this.items[i];
      view.setElement('<a class="list-group-item item sortable" id="item-'+view.model.get('id')+'">');
      view.delegateEvents();
      this.$category.append(view.render().$el);
    }
  }

, refreshSortable: function () {
    this.$category.sortable('refresh');
  }

, toggleItemVisibility: function() {
    this.areItemsVisible = !this.areItemsVisible;
    this.$category.toggle();
  }

, hideItems: function() {
    this.areItemsVisible = false;
    this.$category.hide();
  }

, showItems: function() {
    this.areItemsVisible = true;
    this.$category.show();
  }

, showSaveItemsButton: function() {
    this.$el.find('.save-items').removeClass('hide');
  }

, hideSaveItemsButton: function() {
    this.$el.find('.save-items').addClass('hide');
  }

, moveSelectedItemsToCategory: function(event) {
    var categorySelected = this.menu.getCategoryById($(event.target).attr('data-category-id'));
    var selectedItems = _.filter(this.items, function (item) {
      return item.isSelected();
    });

    _.each(selectedItems, function (item){
      item.category = categorySelected;
      item.$el.appendTo(item.category.$category);
      item.model.set('category_id', item.category.model.id);
      item.category.items.push(item);
    });

    // remove the views from the this.items
    this.items = _.difference(this.items, selectedItems);

    // re-order and save items in the new categorySelected
    categorySelected.reorderItems();
    categorySelected.saveItems();
    categorySelected.refreshSortable();

    // re-order and save items in this category
    this.reorderItems();
    this.saveItems();
    this.refreshSortable();
  }

, onItemMoved: function(event, ui) {
    event.stopPropagation();
    this.reorderItems();
    this.showSaveItemsButton();
  }

, reorderItems: function() {
    this.$el.find('.item').each(function(index, element) {
      $(element).trigger('update-order', index+1);
    });
  }

, updateOrder: function(event, order) {
    event.stopPropagation();
    this.model.set('order', order);
    this.save();
  }

, save: function() {
    if (!this.model.unsavedAttributes()) return;

    this.model.save(this.model.unsavedAttributes(), {
      // patch: true // waiting for pull request to be accepted for patch support to work correctly
    });
  }

, saveItems: function() {
    _.chain(this.items).each(function(item) {
      item.save();
    });
    this.hideSaveItemsButton();
  }
});