/**
 * PaymentMethod Model
 */
var PaymentMethod = Backbone.Model.extend({
  schema: {
    type: 'object',
    properties: {
    }
  },

  validator: amanda('json'),

  validate: function(attrs, options) {
    return this.validator.validate(attrs, _.result(this, 'schema'), options || {}, function(err) { return err; });
  },

  initialize: function(attrs, options) {
    options = options || {};

    if ( 'user' in options ) this.user = options.user;

    attrs = attrs || {};
    if (attrs.addresses) {
      this.addresses = new Addresses(attrs.addresses);
      this.unset('addresses');
    }
  },

  urlRoot: function(){
    return [ '/users', this.user.get('id'), ]
  },
});
