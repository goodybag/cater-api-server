/**
 * AddressForm
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var amanda = require('amanda')
  var utils = require('utils');
  var api = require('api');
  var Address = require('app/models/address');

  return utils.Model.extend({
    defaults: {
      name: null
    , address: null
    , delivery_instructions: null
    , phone: null
    }

  , validator: amanda('json')

  , schema: {
      type: 'object',
      properties: {
        name: {
          type: ['string', 'null'],
          required: false,
          minLength: 1
        },
        address: {
          type: 'string',
          required: true,
          minLength: 1
        },
        phone: {
          type: 'string',
          length: 10,
          pattern: /^\d*$/, //contains only digits
          required: true
        },
        delivery_instructions: {
          type: ['string', 'null'],
          required: false
        },
        lat_lng: {
          type: ['object', 'null'],
          required: false
        }
      }
    }

  , validate: function( data, options ){
      this.validator.validate( data, this.schema, options || {}, utils.identity );
    }

  , displayName: function( field ){
      return this.displayNames[ field ];
    }

  , geocode: function( callback ){
      api.maps.geocode( this.get('address'), function( error, result ){
        if ( error ){
          return callback( error );
        }

        if ( !result.valid ){
          return callback({
            validatorName: 'pattern'
          , property: 'address'
          });
        }

        var address = new Address(
          utils.extend(
            result.address
          , utils.pick( this.attributes, ['id', 'name', 'delivery_instructions', 'phone'] )
          )
        , this.options
        );

        if ( address.get('street2') === null ){
          address.set('street2', '');
        }

        return callback( null, address );
      }.bind( this ));
    }
  }, {
    fieldNounMap: {
      street: 'street address'
    , street2: 'secondary street address'
    , phone: 'phone number'
    , zip: 'zip code'
    , name: 'address name'
    }
  });
});