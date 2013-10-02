var Item = Backbone.Model.extend({
  //TODO: share with server
  schema: function(attrs, options) {
    return {
      type: 'object',
      properties: {
        order: {
          type: 'integer',
          minimum: 0,
          required: true
        },
        name: {
          type: 'string',
          minLength: 1,
          required: true
        },
        description: {
          type: ['string', 'null'],
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
          minimum: attrs.feeds_min || 1,
          required: true
        }
      }
    }
  },

  validator: amanda('json'),

  validate: function(attrs, options) {
    var schema = !_.isFunction(this.schema) ? this.schema : this.schema(attrs, options);
    return this.validator.validate(attrs, schema, options || {}, function(err) { return err; });
  },

  urlRoot: function() { return this.isNew() ? undefined : '/items'; },

  initialize: function(attrs, options) {
    if (options && options.category) this.category = options.category;
  }
});
