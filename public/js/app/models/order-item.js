if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var Backbone = require('backbone');
  var amanda = require('amanda');
  var _ = require('lodash');

  return module.exports = Backbone.Model.extend({
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
        }/*,
        options_sets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: ['string', 'null'],
                required: false
              },
              type: {
                type: 'string',
                "enum": ['radio', 'checkbox'],
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
        }*/
      }
    },

    url: function(){
      var url = Backbone.Model.prototype.url.call( this );

      if ( this.options.edit_token ) url += '?edit_token=' + this.options.edit_token;

      return url;
    },

    initialize: function(attrs, options) {
      this.options = options || {};

      this.on('change:price change:quantity change:options_sets', function(model, value, options) {
        var optPrices = _.pluck(_.where(_.flatten(_.pluck(model.get('options_sets'), 'options')), {state: true}), 'price')
        var priceEach = _.reduce(optPrices, function(a, b) { return a + b; }, model.get('price'));
        model.set('sub_total', model.get('quantity') * priceEach);
      });
    },

    validator: amanda('json'),

    validate: function(attrs, options){
      var errors = [];

      var schemaErrors = this.validator.validate(attrs, _.result(this, 'schema'), options || {}, function(err) { return err; });

      var radioSets = _.where(attrs.options_sets, {type: 'radio'});

      // Ensure that all radios have an option with state === true
      var emptySets = _( radioSets ).filter( function( optionsSet ) {
        return !_.some(_.pluck(optionsSet.options, 'state'));
      });

      errors = errors.concat( _( emptySets ).map( function( optionsSet ){
        return {
          name:           'OPTIONS_SET_REQUIRED',
          optionSetName:  optionsSet.name,
          optionSetId:    optionsSet.id,
          message:        optionsSet.name + ' is required'
        };
      }));


      // Add min/max errors
      errors = errors.concat(

        // Find all checkboxes that have a min/max
        _.chain( attrs.options_sets ).filter( function( set ){
          return ( set.type === 'checkbox' && ( set.selected_min || set.selected_max ) );

        // Filter to the ones that do not satisfy min/max
        }).reject( function( set ){
          var selected = _( set.options ).where({ state: true }).length;
          return selected >= set.selected_min && selected <= set.selected_max;

        // Transform the rejects into errors
        }).map( function( reject ){
          var selected        = _( reject.options ).where({ state: true }).length;
          var isMinError      = selected < reject.selected_min;
          var requiredAmount  = isMinError ? reject.selected_min : reject.selected_max;

          return {
            name:           isMinError ? 'MIN_REQUIREMENT' : 'MAX_REQUIREMENT'
          , optionSetName:  reject.name
          , optionSetId:    reject.id
          , message: [
              'You must select'
            , isMinError ? 'at least' : 'at most'
            , requiredAmount
            , 'checkbox' + ( requiredAmount > 1 ? 'es' : '' )
            ].join(' ')
          }
        }).value()
      );

      if ( this.attributes.min_qty && attrs.quantity < this.attributes.min_qty ) {
        errors.push({
          name: 'MIN_QUANTITY_REQUIRED',
          message: 'Item quantity must be ' + attrs.min_qty + ' or greater'
        });
      }

      errors = errors.concat(schemaErrors ? Array.prototype.slice.call(schemaErrors) : [])

      return errors.length ? errors : null;
    }
  });
});
