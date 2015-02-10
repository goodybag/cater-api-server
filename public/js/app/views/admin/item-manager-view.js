define(function(require, exports, module) {
  var utils = require('utils');
  var ToggleView = require('./toggle-view');
  var ItemManagerView = utils.View.extend({
    initialize: function () {
      var this_ = this;
        
      // Enable plugins
      $('[data-role="popover"]').gb_popover();
      $('[data-toggle="tooltip"]').tooltip();

      this.options.itemSelector = this.options.itemSelector || '.table-list-item';
      this.$el.find(this.options.itemSelector).each(function (idx, el) {
        var $el = $(el);
        var json = $el.data(this_.options.dataAttr);
        var model = new this_.options.model(json);

        this_.initToggleViews(model, "[data-id='"+$el.data('id')+"']", this);
      });
    },

    /**
    * Init Toggle Views
    * @param {object} - should be an instance of a model
    * @param {string} - view element
    * @param {object} - scope
    */
    initToggleViews: function (model, el, self) {
        var HiddenView = new ToggleView({
          el: el
        , field: 'is_hidden'
        , model: model
        , toggleSelector: '.is-hidden-toggle'
        , success: function(model, response, options) {
            $(self).find('.is-hidden-toggle > span').toggleClass('hide');
        }
        });

        var ArchiveView = new ToggleView({
          el: el
        , field: 'is_archived'
        , model: model
        , toggleSelector: '.is-archived-toggle'
        });
    }
  });

  return ItemManagerView;
});