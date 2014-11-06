/**
 * Base Model
 */
define(function(require, exports, module) {
  var amanda = require('amanda');
  var utils = require('utils');

  var BaseModel = module.exports = Backbone.Model.extend({
    schema: {
      type: 'object',
      properties: {}
    },

    validator: amanda('json'),

    validate: function(attrs, options) {
      return this.validator.validate(attrs, _.result(this, 'schema'), options || {}, function(err) { return err; });
    }
  });

  return BaseModel;
});
