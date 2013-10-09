var Address = Backbone.Model.extend({
  schema: {
    type: 'object',
    properties: {
      street: {
        type: 'string',
        required: true
      },
      city: {
        type: 'string',
        required: true
      },
      state: {
        type: 'string',
        required: true
      },
      zip: {
        type: 'string',
        required: true
      }
    }
  },

  // TODO: extract to superclass
  validator: amanda('json'),

  validate: function(attrs, options) {
    return this.validator.validate(attrs, this.schema, options || {}, function(err) { return err; });
  },

  initialize: function(attrs, options) {
    attrs = attrs || {};
    options = options || {};
  },

  urlRoot: '/users/me/addresses'
});
