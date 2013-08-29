var Restaurant = Backbone.Model.extend({
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        required: true
      },
      phone: {
        type: 'string',
        length: 10,
        pattern: /^\d*$/, //contains only digits
        required: true
      },
      email: {
        type: 'string',
        format: 'email',
        required: true
      },
      price: {
        type: 'integer',
        minimum: 1,
        maximum: 4,
        required: true
      },
      cuisine: {
        type: 'array',
        uniqueItems: true,
        items: {
          type: 'string',
          minLength: 1,
          pattern: /^[\w-]*$/ // consists only of word characters or hyphen
        }
      },
      minimum_order: {
        type: ['integer', 'null'],
        minimum: 0
      },
      delivery_fee: {
        type: ['integer', 'null'],
        minimum: 0
      },
      street: {
        type: 'string',
        minLength: 1,
        required: true
      },
      city: {
        type: 'string',
        minLenght: 1,
        required: true
      },
      state: {
        type: 'string',
        length: 2,
        pattern: /^[A-Z]*$/, // only capital letters
        enum: _.pluck(states, 'abbr'),
        required: true
      },
      zip: {
        type: 'string',
        length: 5,
        pattern: /^\d*$/, // only digits
        required: true
      }
    }
  },

  // TODO: extract to superclass
  validator: amanda('json'),

  validate: function(attrs, options) {
    return this.validator.validate(attrs, this.schema, options || {}, function(err) { return err; });
  },

  urlRoot: '/restaurants',

  initialize: function(attrs, options) {
    attrs = attrs || {};
    options = options || {};

    this.categories = attrs.categories instanceof Categories ? attrs.categories : new Categories(attrs.categories || [], {restaurant: this});
    this.unset('categories');
  }
});
