define(function(require, exports, module) {
  var Backbone = require('backbone');
  var amanda = require('amanda');

  module.exports = Backbone.Model.extend({
    // TODO: extract to superclass
    validator: amanda('json'),

    validate: function(attrs, options) {
      options = _.defaults(options || {}, {
        enforceRequired: true,
        singleError: false
      });

      var schema = _.clone(_.result(this.constructor, 'schema'));
      if (!options.enforceRequired) {
        schema.properties = _.objMap(schema.properties, _.compose(
          _.partialRight(_.omit, 'required'),
          function(property) {
            return _.extend(property, {type: _.uniq(['null'].concat(property.type))});
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
    },

    fieldNounMap: {
      street: 'street address'
    , street2: 'secondary street address'
    , phone: 'phone number'
    , zip: 'zip code'
    , name: 'address name'
    }
  });
});
