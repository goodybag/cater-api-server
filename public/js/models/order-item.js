var OrderItem = Backbone.Model.extend({
  schema: {
    type: 'object',
    properties: {
      quantity: {
        type: 'integer',
        minimum: 1,
        required: true
      },
      notes: {
        type: ['string', 'null'],
        minLength: 1,
        required: false
      },
      options_sets: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: ['string', 'null'],
              minLength: 1,
              required: false
            },
            type: {
              type: 'string',
              enum: ['radio', 'checkbox'],
              required: true
            },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    minLength: 1,
                    required: true
                  },
                  description: {
                    type: ['string', 'null'],
                    minLength: 1,
                    required: false
                  },
                  price: {
                    type: ['integer', 'null'],
                    required: false
                  },
                  state: {
                    type: 'boolean'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  initialize: function(attrs, options) {
    this.on('change:price change:quantity change:options_sets', function() {
      var total = this.get('price');

      // Add in all selected options
      _(this.get('options_sets')).each( function( set ){
        _(set.options).each( function( option ){
          if ( option.state ) total += option.price;
        })
      });

      this.set('sub_total', total * this.get('quantity'));
    }, this);
  },

  validator: amanda('json'),

  validate: function(attrs, options){
    var schemaErrors = this.validator.validate(attrs, _.result(this, 'schema'), options || {}, function(err) { return err; });

    // An array of options arrays whose parent set are type radio
    var radioSets = _.where(attrs.options_sets, {type: 'radio'});

    // Ensure that all radios have a state === true
    var emptySets = _( radioSets ).filter( function( optionsSet ) {
      return !_.some(_.pluck(optionsSet.options, 'state'));
    });

    var errors = _( emptySets ).map( function( optionsSet ){
      return {
        name:           'OPTIONS_SET_REQUIRED'
        , optionSetName:  optionsSet.name
        , optionSetId:    optionsSet.id
        , message:        optionsSet.name + ' is required'
      };
    }).concat(schemaErrors ? Array.prototype.slice.call(schemaErrors) : []);

    return errors.length ? errors : null;
  }
});
