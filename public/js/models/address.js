var Address = Backbone.Model.extend({
  schema: {
    type: 'object',
    properties: {
      name: {
        type: ['string', 'null'],
        required: false
      },
      street: {
        type: 'string',
        required: true
      },
      street2: {
        type: ['string', 'null'],
        required: false
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

  urlRoot: '/users/me/addresses'
});
