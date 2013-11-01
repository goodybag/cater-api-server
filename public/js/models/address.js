var Address = Backbone.Model.extend({
  // TODO: extract to superclass
  validator: amanda('json'),

  validate: function(attrs, options) {
    options = _.defaults(options || {}, {enforceRequired: true})

    var schema = _.clone(_.result(this.constructor, 'schema'));
    if (!options.enforceRequired) {
      schema.properties = _.objMap(schema.properties, _.compose(
        _.partialRight(_.omit, 'required'),
        function(property) {
          property.type = ['null'].concat(property.type);
        })
      );
    }

    return this.validator.validate(attrs, schema, options, _.identity);
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
        type: 'string',
        required: false
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
        type: 'string',
        length: 10,
        pattern: /^\d*$/, //contains only digits
        required: true
      },
      delivery_instructions: {
        type: ['string', 'null'],
        required: false,
        minLength: 1
      }
    }
  }
});
