define(function(require){
  var utils = require('utils');
  var Restaurant = require('app/models/restaurant');

  // todo extract
  var ToggleHiddenView = utils.View.extend({
    events: function() {
      var ev = 'click ' + this.options.toggleSelector;
      var events = {};
      events[ev] = 'toggleHiddenOnClick';
      return events;
    }

  , initialize: function() {
      this.options.toggleSelector = this.options.toggleSelector || '.is-hidden-toggle';
    }

  , toggleHiddenOnClick: function(e) {
      var restaurant = this.options.restaurant;
      restaurant.save({ is_hidden: !restaurant.get('is_hidden') }, {
        success: function(model, response, options) {
          // swap toggle icon
          console.log('success', arguments);
        },

        error: function(model, response, options) {
          // alert!!!
          console.log('error', arguments);
        }
      });
    }
  });

  return utils.View.extend({
    initialize: function() {
      var this_ = this;

      // Enable popovers
      $('[data-role="popover"]').gb_popover();

      // Init toggle visibility views
      this.options.itemSelector = this.options.itemSelector || '.table-list-item';
      this.$el.find(this.options.itemSelector).each(function(idx, el) {
        var $el = $(el);
        var thv = new ToggleHiddenView({
          el: el,
          restaurant: new Restaurant($el.data('restaurant'))
        });
      });

    },
  });
});
