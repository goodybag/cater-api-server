define(function(require, exports, module) {
  var utils = require('utils');
  var ToggleHiddenView = require('./toggle-hidden-view');

  return module.exports = ToggleHiddenView.extend({
    events: function () {
      return utils.extend({}, ToggleHiddenView.prototype.events.bind(this).call(), {
        'click .btn-unarchive': 'unarchive'
      });
    }

    , unarchive: function (e) {
      e.preventDefault();
      var restaurant = this.options.model;
      restaurant.save({ is_archived: false }, {
        success: function (model, response, options) {
          window.location.reload();
        },

        error: function (model, response, options) {
          alert('Could not remove restaurant from archive');
        }
      });
    }

  });
});