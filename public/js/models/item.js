var Item = Backbone.Model.extend({
  //TODO: share with server
  schema: {
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
        minimum: 1,
        required: true
      }
    }
  },

  defaults: {
    options: [
      {
        type: 'or'
      , name: 'Buns'
      , choices: [
          { name: 'White Bun',  price: 0 }
        , { name: 'Wheat Bun',  price: 0 }
        , { name: 'Rye Bun',    price: 50 }
        ]
      }

    , {
        type: 'and'
      , name: 'Toppings'
      , choices: [
          { name: 'Pickles',    price: 0 }
        , { name: 'Lettuce',    price: 0 }
        , { name: 'Tomato',     price: 0 }
        , { name: 'Onion',      price: 0 }
        , { name: 'Mayonaise',  price: 0 }
        , { name: 'Mustard',    price: 0 }
        , { name: 'Ketchup',    price: 0 }
        , { name: 'Jalapenos',  price: 25 }
        ]
      }
    ]
  },

  validator: amanda('json'),

  validate: function(attrs, options) {
    return this.validator.validate(attrs, this.schema, options || {}, function(err) { return err; });
  },

  urlRoot: function() { return this.isNew() ? undefined : '/items'; },

  initialize: function(attrs, options) {
    if (options && options.category) this.category = options.category;
  }
});
