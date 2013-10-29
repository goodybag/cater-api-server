/**
 * Handles toggling collapsible icons, triggering search
 * on filter change
 */

var RestaurantFiltersView = Backbone.View.extend({
  events: {
    'change .checkbox': 'onFilterChange'
  }

, initialize: function() {
    var collapsibles = this.$el.find('.collapse');
    collapsibles.on('show.bs.collapse', this.toggleCollapsible);
    collapsibles.on('hide.bs.collapse', this.toggleCollapsible);
  }

, onFilterChange: function(e) {
    this.trigger('filters:change');
  }

, getProps: function() {
    return {
      diets:     _.pluck(this.$el.find('#panelDiet input:checked'), 'value')
    , cuisines:  _.pluck(this.$el.find('#panelCuisine input:checked'), 'value')
    , prices:    _.pluck(this.$el.find('#panelPrice input:checked'), 'value')
    , mealTypes: _.pluck(this.$el.find('#panelMealTypes input:checked'), 'value')
    };
  }

, toggleCollapsible: function(e) {
    var $panelIcon = $(e.currentTarget).siblings('.panel-heading').find('.glyphicon');
    $panelIcon.toggleClass('glyphicon-chevron-down glyphicon-chevron-right');
  }
});
