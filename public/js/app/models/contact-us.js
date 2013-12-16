/**
 * Contact Us Model
 * Just need simple validation
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
          minLength: 1,
          required: true
        },
        email: {
          type: 'string',
          format: 'email',
          minLength: 1,
          required: true
        },
        message: {
          type: 'string',
          minLength: 1,
          required: true
        },
      }
    },

    validator: amanda('json'),

    validate: function(attrs, options) {
      return this.validator.validate(attrs, this.schema, options || {}, function(err) { return err; });
    },

    urlRoot: '/contact-us',
  });
});