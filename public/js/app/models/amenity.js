/**
 * Restaurant Amenity Model
 */
define(function(require, exports, module) {
  var amanda = require('amanda');
  var utils = require('utils');

  var Amenity = module.exports = Backbone.Model.extend({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: ['string', 'null'],
          required: false
        },
        description: {
          type: ['string', 'null'],
          required: false
        },
        price: {
          type: 'integer',
          minimum: 0,
          default: 0,
          required: true
        },
      }
    },

    validator: amanda('json'),

    validate: function(attrs, options) {
      return this.validator.validate(attrs, _.result(this, 'schema'), options || {}, function(err) { return err; });
    }
  });

  return Amenity;
});
