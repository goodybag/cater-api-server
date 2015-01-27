define(function(require){
  var utils = require('utils');

  // todo extract
  var ToggleHiddenView = utils.View.extend({
    events: {
      'click .toggle-hidden': 'toggleHiddenOnClick'
    }
  , isHidden: function() {
      return this.$el.find('').data('is-hidden') === 'true';
    }
  , toggleHiddenOnClick: function(e) {
      // var model = new Restaurant ({id: this.options.id, isHidden: this.isHidden() });
    }
  });

  return utils.View.extend({
    initialize: function() {
      var this_ = this;
      // Enable sub components
      $('[data-role="popover"]').gb_popover();

      this.$el.find('.table-list-item').each(function(idx, el) {
        // var $el = $(el);
        // new thv = new ToggleHiddenView({ el: '.toggle-selector-here', restaurantId: $el.data('id') });

      });
    },
  });
});
