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
        url: {
          type: 'string',
          required: true
        },
        name: {
          type: ['string', 'null'],
          required: false
        },
        description: {
          type: ['string', 'null'],
          required: false
        },
        priority: {
          type: ['int', 'null'],
          required: false
        }
      }
    },

    validator: amanda('json'),

    validate: function(attrs, options) {
      return this.validator.validate(attrs, _.result(this, 'schema'), options || {}, function(err) { return err; });
    },

    urlRoot: function() {
      return '/restaurants/' + this.attributes.restaurant_id + '/photos';
    }
  });
});
