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
        required: false
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
