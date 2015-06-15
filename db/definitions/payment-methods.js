/**
 * Payment Methods Schema
 */

if (typeof module === 'object' && typeof define !== 'function') {
  var define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

var
  types = require('../data-types')
;

define(function(require) {
  var definition = {};
  definition.name = 'payment_methods';

  definition.schema = {
    id: {
      type: types.serial
    , pk: true
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'NOW()'
    }
  , type: {
      type: types.paymentmethod
    , nullable: false
    }
  , uri: {
      type: types.text
    , nullable: false
    , unique: true
    }
  , data: {
      type: types.json
    , nullable: false
    }
  , stripe_id: { type: types.text }
  };

  definition.indices = {};

  return definition;
});
