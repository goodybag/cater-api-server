define(function(require, exports, module) {
  var Backbone = require('backbone');

  module.exports = Backbone.View.extend({

    events: {
      'click .hide-all-items': 'hideAllItems'
    , 'click .show-all-items': 'showAllItems'
    , 'category-moved': 'onCategoryMoved'
    }

  , initialize: function(options) {
      this.categories = [];
      this.$el.find('.menu').sortable({
        handle: '> .menu-cateogry-heading'
      , update: function(event, ui) {
          ui.item.trigger('category-moved', ui);
        }
      });
    }

  , hideAllItems: function() {
      for(var i=0, len=this.categories.length; i<len; i++) {
        var category = this.categories[i];
        category.hideItems();
      }
    }

  , showAllItems: function() {
      for(var i=0, len=this.categories.length; i<len; i++) {
        var category = this.categories[i];
        category.showItems();
      }
    }

  , getCategoryById: function(id) {
      return _.find(this.categories, function(category){
        return category.model.id == id;
      });
    }

  , onCategoryMoved: function(event, ui) {
      event.stopPropagation();
      this.reorderCategories();
    }

  , reorderCategories: function() {
      this.$el.find('.menu-category').each(function(index, element) {
        $(element).trigger('update-order', index+1);
      });
    }
  });
});