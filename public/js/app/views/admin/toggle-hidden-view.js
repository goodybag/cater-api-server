// Super specific view for toggling is_hidden on restaurant listing
define(function(require) {
  var utils = require('utils');

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
      e.preventDefault();
      var this_ = this;
      var restaurant = this.options.model;
      restaurant.save({ is_hidden: !restaurant.get('is_hidden') }, {
        success: function(model, response, options) {
          this_.$el.find(this_.options.toggleSelector + ' > span').toggleClass('hide');
        },

        error: function(model, response, options) {
          alert('Could not toggle visibility for this restaurant!'); // fancy
        }
      });
    }
  });

  return ToggleHiddenView;
});
