define(function(require, exports, module) {
  var Backbone = require('backbone');

  module.exports = Backbone.View.extend({
    events: {
      'click .btn-retry': 'retry'
    },

    setModel: function(model) {
      // stop listening to old model
      this.model = model;
      // set events on new model
    },

    retry: function(e) {
      var view = this;
      this.$el.one('hidden.bs.modal', function() {
        view.model.copy(function(err, newOrder) {
          if (err) {
            view.$el.modal('show');
          } else {
            var queryParams = {
              copy: true
            };

            if (newOrder.get('lostItems')) queryParams.lostItems = _.pluck(newOrder.get('lostItems'), 'name');
            window.location = _.result(newOrder, 'url') + '/items' + utils.queryParams(queryParams);
          }
        }); // Step 2: when hide is done, copy.
      });
      this.$el.modal('hide');  // Step 1: hide modal
    }
  });
});