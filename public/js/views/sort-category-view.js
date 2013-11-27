var SortCategoryView = Backbone.View.extend({

  events: {
    'sorted': 'sorted'
  , 'click .save-items': 'saveItems'
  }

, initialize: function(options) {
    this.items = [];
    this.$el.find('.category').sortable({
      connectWith: '.category'
    , stop: function(event, ui) {
        ui.item.trigger('sorted', ui);
      }
    });
  }

, render: function() {
    this.$el.replaceWith(this.template(this.model.toJSON()));
    return this;
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