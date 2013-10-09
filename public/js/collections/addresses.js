var Addresses = Backbone.Collection.extend({
  model: Address,

  url: '/users/me/addresses',

  comparator: 'id',

  initialize: function(models, options) {
  }
});
