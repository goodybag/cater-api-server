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

  // save: function(){
  //   // A lot of this is taken from the backbone source so I can make
  //   // assumptions about the arguments.
  //   // The reason we're overriding save is so we can first make a request
  //   // to the balanced API.

  //   var attrs, method, xhr, attributes = this.attributes;

  //   //Handle both "key", value and {key: value} -style arguments.
  //   if (key == null || typeof key === 'object') {
  //     attrs = key;
  //     options = val;
  //   } else {
  //     (attrs = {})[key] = val;
  //   }

  //   options = _.extend({validate: true}, options);

  //   // If we're not waiting and attributes exist,
  //   // save acts as set(attr).save(null, opts) with validation.
  //   // Otherwise, check if the model will be valid when the attributes,
  //   // if any, are set.
  //   if (attrs && !options.wait) {
  //     if (!this.set(attrs, options)) return false;
  //   } else {
  //     if (!this._validate(attrs, options)) return false;
  //   }

  //   // Set temporary attributes if {wait: true}.
  //   if (attrs && options.wait) {
  //     this.attributes = _.extend({}, attributes, attrs);
  //   }

  //   if ( this.isNew() ){

  //   }
  // }
});