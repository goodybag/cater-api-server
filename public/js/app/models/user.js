if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

/**
 * User Model
 */
define(function(require, exports, module) {
  var Backbone = require('backbone');
  var amanda = require('amanda');

  var Addresses = require('../collections/addresses');
  var PaymentMethods = require('../collections/payment-methods');

  return module.exports = Backbone.Model.extend({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          minLength: 1,
          required: true
        },
        password: {
          type: 'string',
          minLength: 1,
          required: true
        },
        name: {
          type: ['string', 'null'],
          required: false
        },
        organization: {
          type: ['string', 'null'],
          required: false
        },
        groups: {
          type: 'array',
          required: true
        },
        restaurant_ids: {
          type: 'array',
          required: false
        },
        region_id: {
          type: ['number', 'null']
        }
      }
    },

    validator: amanda('json'),

    validate: function(attrs, options) {
      return this.validator.validate(attrs, _.result(this, 'schema'), options || {}, function(err) { return err; });
    },

    initialize: function(attrs, options) {
      attrs = attrs || {};
      if (attrs.addresses) {
        this.addresses = new Addresses(attrs.addresses);
        this.unset('addresses');
      }

      if (attrs.payment_methods) {
        this.payment_methods = new PaymentMethods(attrs.payment_methods);
      }
    },

    urlRoot: '/users',
  });
});
