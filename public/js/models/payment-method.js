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

  updateBalancedAndSave: function(data, callback){
    var this_ = this;

    balanced.card.create(data, function(res) {
      if (res.status !== 201) return callback ? callback(res.error) : null;

      var pm = {
        data:     res.data
      , uri:      res.data.uri
      , type:     res.data._type
      , name:     data.name
      };

      this_.save(pm, {
        wait: true
      , success: function(){ if (callback) callback(null, this); }
      , error: function(model, xhr){
          if (callback) return callback("something went wrong");
          notify.error("something went wrong");
        }
      });
    });
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