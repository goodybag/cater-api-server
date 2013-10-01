/**
 * Create User Model
 */
var CreateUser = Backbone.Model.extend({
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
    }
  },

  validator: amanda('json'),

  validate: function(attrs, options) {
    return this.validator.validate(attrs, this.schema, options || {}, function(err) { return err; });
  },

  urlRoot: '/users',
});