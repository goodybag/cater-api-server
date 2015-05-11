define(function(require, exports, module) {
  var utils = require('utils');
  var ToggleView = require('./toggle-view');
  var ToggleHiddenView = require('./toggle-hidden-view');

  var ItemManagerView = utils.View.extend({
    initialize: function () {
      this.initToggleViews.call(this, this.options.model);
    },

    /**
    * Init Toggle Views
    * @param {object} - should be an instance of a model
    * @param {string} - view element
    */
    initToggleViews: function (model, el) {
      var HiddenView = new ToggleHiddenView({
        el: this.$el.find('.is-hidden-toggle')
      , field: 'is_hidden'
      , model: model
      });

      var FeaturedView = new ToggleView({
          el: this.$el.find('.is-featured-toggle')
        , field: 'is_featured'
        , model: model
      });

      var ArchiveView = new ToggleView({
        el: this.$el.find('.is-archived-toggle')
      , field: 'is_archived'
      , model: model
      });
    }
  });

  return ItemManagerView;
});
