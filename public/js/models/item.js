var Item = Backbone.Model.extend({
  //TODO: share with server
  schema: {
    type: 'object',
    properties: {
      order: {
        type: 'integer',
        minimum: 1,
        required: true
      },
      name: {
        type: 'string',
        minLength: 1,
        required: true
      },
      description: {
        type: 'string',
        minLength: 1
      },
      price: {
        type: 'integer',
        minimum: 0,
        required: true
      },
      feeds_min: {
        type: 'integer',
        minimum: 1,
        required: true
      },
      feeds_max: {
        type: 'integer',
        minimum: 1,
        required: true
      }
    }
  },

  validate: function() {
    //TODO: amanda

  },

  urlRoot: function() { return this.isNew() ? undefined : '/items'; },

  initialize: function(attrs, options) {
    if (options && options.category) this.category = options.category;
  }
});
