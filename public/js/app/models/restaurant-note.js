/**
 * Restaurant Event Model
 */
define(function(require, exports, module) {
  var amanda = require('amanda');
  var utils = require('utils');

  return module.exports = Backbone.Model.extend({
    schema: {
      type: 'object',
      properties: {
        note: {
          type: 'string',
          required: true
        },
      }
    },

    validator: amanda('json'),

    url: function() {
      return ['/api/restaurants', this.attributes.restaurant_id, 'notes'].join('/');
    },

    validate: function(attrs, options) {
      return this.validator.validate(attrs, _.result(this, 'schema'), options || {}, function(err) { return err; });
    }
  });
});
