/**
 * Restaurant Event Model
 */
define(function(require, exports, module) {
  var Backbone = require('backbone');
  var amanda = require('amanda');

  return module.exports = Backbone.Model.extend({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          required: true
        },
        description: {
          type: ['string', 'null'],
          required: false
        },
        date_range: {
          type: 'string',
          required: true
        },
        closed: {
          type: 'boolean',
          required: true
        }
      }
    },

    validator: amanda('json'),

    validate: function(attrs, options) {
      return this.validator.validate(attrs, _.result(this, 'schema'), options || {}, function(err) { return err; });
    },

    urlRoot: function() { 
      return '/restaurants/' + this.attributes.restaurant_id + '/events'
    }
  });
});