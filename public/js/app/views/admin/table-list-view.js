define(function(require){
  var utils = require('utils');

  require('table-list');

  return utils.View.extend({
    initialize: function() {
      var this_ = this;
      var Model = this_.options.model;
      var ItemView = this_.options.itemView;

      // Enable plugins
      $('[data-role="popover"]').gb_popover();
      $('[data-toggle="tooltip"]').tooltip();
      this.$el.gb_tablelist();

      // Init toggle visibility views
      this.options.itemSelector = this.options.itemSelector || '.table-list-item';
      this.$el.find(this.options.itemSelector).each(function(idx, el) {
        var $el = $(el);
        var json = $el.data(this_.options.dataAttr);
        var itemView = new ItemView({
          el: el
        , model: new Model(json)
        , parentView: this_
        });
      });
    }
  });
});
