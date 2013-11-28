var SortCategoryView = Backbone.View.extend({

  events: {
    'sorted': 'sorted'
  , 'update-order': 'updateOrder'
  , 'click .toggle-items': 'toggleItemVisibility'
  , 'click .save-items': 'saveItems'
  }


, initialize: function(options) {
    this.items = [];
    this.showItems = true;
    this.template = options.template;
    this.menu = options.menu;

    this.listenTo(this.model, 'change', this.render);

    this.$el.find('.category').sortable({
      connectWith: '.category'
    , stop: function(event, ui) {
        ui.item.trigger('sorted', ui);
      }
    });
  }

, render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    this.renderItems();
    this.$el.find('.category').sortable({
      connectWith: '.category'
    , stop: function(event, ui) {
        ui.item.trigger('sorted', ui);
      }
    });

    return this;
  }

, renderItems: function() {
    this.$el.find('.category').empty();

    if (!this.showItems) this.$el.find('.category').hide();

    this.items = _.sortBy(this.items, function(item) {
      return item.model.get('order');
    });

    for (var i=0, len=this.items.length; i<len; i++) {
      var view = this.items[i];
      view.setElement('<a class="list-group-item item sortable" id="item-'+view.model.get('id')+'">');
      view.delegateEvents();
      this.$el.find('.category').append(view.render().$el);
    }
  }

, toggleItemVisibility: function() {
    this.showItems = !this.showItems;
    this.$el.find('.category').toggle();
  }

, updateOrder: function(event, order) {
    event.stopPropagation();
    this.model.set('order', order);
    this.save();
  }

, sorted: function(event, ui) { // passing in a jquery sortable stop event's args
    event.stopPropagation();
    this.menu.$el.find('.menu-category').each(function(index, element) {
      $(element).trigger('update-order', index+1);
    });
  }

, save: function() {
    if (!this.model.hasChanged()) return;

    var data = {
      order: this.model.get('order')
    };

    this.model.save(data, {
      patch: true
    });
  }

, showSaveItemsButton: function() {
    this.$el.find('.save-items').removeClass('hide');
  }

, hideSaveItemsButton: function() {
    this.$el.find('.save-items').addClass('hide');
  }

, saveItems: function() {
    _.chain(this.items).each(function(item) {
      item.save();
    });
    this.hideSaveItemsButton();
  }
});