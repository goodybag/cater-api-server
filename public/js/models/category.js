var Category = Backbone.Model.extend({
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
      menus: {
        type: 'array',
        uniqueItems: true,
        items: {
          type: 'string',
          minLength: 1,
          pattern: /^[\w\-\/]*$/ // consists only of word characters or hyphen
        }
      },
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

    this.items = attrs.items instanceof Items ? attrs.items : new Items(attrs.items || [], {category: this});
    this.unset('items');

    this.restaurant = options.restaurant instanceof Restaurant ? options.restaurant : new Restaurant(options.restaurant || {id: this.get('restaurant_id')})
    this.unset('restaurant_id');
  },

  urlRoot: function() { return _.result(this.restaurant, 'url') + '/categories'}
});
