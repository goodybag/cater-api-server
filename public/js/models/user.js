/**
 * User Model
 */
var User = Backbone.Model.extend({
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
      first_name: {
        type: 'string',
        required: false
      },
      last_name: {
        type: 'string',
        required: false
      },
      organization: {
        type: 'string',
        required: false
      },
      groups: {
        type: 'array',
        required: true
      }
    }
  },

  validator: amanda('json'),

  validate: function(attrs, options) {
    return this.validator.validate(attrs, this.schema, options || {}, function(err) { return err; });
  },

  urlRoot: '/users',
});