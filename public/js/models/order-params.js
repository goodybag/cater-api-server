var OrderParams = Backbone.Model.extend({
  url: '/session/order-params',
  isNew: function() { return false; }
});
