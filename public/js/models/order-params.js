var OrderParams = Backbone.Model.extend({
  url: '/session/order-params',
  isNew: function() { return false; },
  isComplete: function() {
    return _.reduce(['zip', 'guests', 'date', 'time'], function(memo, key) { return memo && this.get(key); }, true, this);
  }
});
