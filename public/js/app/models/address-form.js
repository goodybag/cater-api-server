/**
 * AddressForm
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');

  return utils.Model.extend({
    defaults: {
      name: null
    , address: null
    , delivery_instructions: null
    , phone: null
    }

  , displayNames: {
      name: 'Name'
    , address: 'Address'
    , delivery_instructions: 'Delivery Instructions'
    , phone: 'Phone'
    }

  , validate: function( data ){

    }

  , displayName: function( field ){
      return this.displayNames[ field ];
    }
  });
});