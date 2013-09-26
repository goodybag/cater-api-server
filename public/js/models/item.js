var Item = Backbone.Model.extend({
  //TODO: share with server
  schema: {
    type: 'object',
    properties: {
      order: {
        type: 'integer',
        minimum: 0,
        required: true
      },
      name: {
        type: 'string',
        minLength: 1,
        required: true
      },
      description: {
        type: ['string', 'null'],
        minLength: 1
      },
      price: {
        type: 'integer',
        minimum: 0,
        required: true
      },
      feeds_min: {
        type: 'integer',
        minimum: 1,
        required: true
      },
      feeds_max: {
        type: 'integer',
        minimum: 1,
        required: true
      }
    }
  },

  validator: amanda('json'),

  validate: function(attrs, options) {
    return this.validator.validate(attrs, this.schema, options || {}, function(err) { return err; });
  },

  urlRoot: function() { return this.isNew() ? undefined : '/items'; },

  initialize: function(attrs, options) {
    if (options && options.category) this.category = options.category;
    this.attributes.options_sets = new OptionsSetCollection( attrs.options_sets );
  },

  set: function( key, val ){
    if ( typeof key === 'object' ) return Backbone.Model.prototype.set.apply( this, arguments );

    if ( key === 'options_sets' && !(val instanceof OptionsSetCollection) ){
      val = new OptionsSetCollection( attrs.options_sets )
    }

    return Backbone.Model.prototype.set.call( this, key, val );
  },

  toJSON: function(){
    return _.extend( {}, this.attributes, {
      options_sets: this.attributes.options_sets.toJSON()
    });
  }
});
