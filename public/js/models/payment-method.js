/**
 * PaymentMethod Model
 */
var PaymentMethod = Backbone.Model.extend({
  schema: {
    type: 'object',
    properties: {}
  },

  validator: amanda('json'),

  validate: function(attrs, options) {
    return this.validator.validate(attrs, _.result(this, 'schema'), options || {}, function(err) { return err; });
  },

  initialize: function(attrs, options) {
    options = options || {};

    attrs = attrs || {};

    return this;
  },

  urlRoot: function(){
    return [ '/users', this.get('user_id'), 'cards' ].join('/');
  },

  isExpired: function(){
    var data = this.get('data');
    var date = new Date();
    return (
      date.getFullYear() > data.expiration_year ||
      date.getFullYear() === data.expiration_year &&
      date.getMonth() + 1 > data.expiration_month
    );
  }
});