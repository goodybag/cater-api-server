var Address = Backbone.Model.extend({
  // TODO: extract to superclass
  validator: amanda('json'),

  validate: function(attrs, options) {
    return this.validator.validate(attrs, _.result(this.constructor, 'schema'), options || {}, function(err) { return err; });
  },

  urlRoot: '/users/me/addresses'
}, {
  schema: {
    type: 'object',
    properties: {
      name: {
        type: ['string', 'null'],
        required: false,
        minLength: 1
      },
      street: {
        type: 'string',
        required: true,
        minLength: 1
      },
      street2: {
        type: ['string', 'null'],
        required: false,
        minLength: 1
      },
      city: {
        type: 'string',
        required: true,
        minLength: 1
      },
      state: {
        type: 'string',
        required: true,
        length: 2
      },
      zip: {
        type: 'string',
        length: 5,
        pattern: /^\d*$/, //contains only digits
        required: true
      },
      phone: {
        type: ['string', 'null'],
        length: 10,
        pattern: /^\d*$/, //contains only digits
        required: false
      },
      delivery_instructions: {
        type: ['string', 'null'],
        required: false,
        minLength: 1
      }
    }
  }
});
