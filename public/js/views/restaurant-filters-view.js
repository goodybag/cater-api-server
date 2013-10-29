var RestaurantFiltersView = Backbone.View.extend({
  events: {
    'click .checkbox': 'filterOnClick',
  }

, filterOnClick: function(e) {
    utils.pubSub.trigger('filter:click');
  }
});
