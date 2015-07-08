if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var Backbone = require('backbone');
  var amanda = require('amanda');
  var utils = require('utils');

  return module.exports = Backbone.Model.extend({
    // TODO: extract to superclass
    validator: amanda('json'),

    validate: function(attrs, options) {
      options = _.defaults(options || {}, {
        enforceRequired: true,
        singleError: false
      });

      var schema = _.clone(_.result(this.constructor, 'schema'));
      if (!options.enforceRequired) {
        schema.properties = _.clone( schema.properties );
        for ( var key in schema.properties ){
          schema.properties[ key ].required = false;

          if ( !utils.isArray( schema.properties[ key ].type ) ){
            schema.properties[ key ].type = [ schema.properties[ key ].type ];
          }

          if ( schema.properties[ key ].type.indexOf('null') === -1 ){
            schema.properties[ key ].type.push('null');
          }
        }
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
        },
        lat_lng: {
          type: ['object', 'null'],
          required: false
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
