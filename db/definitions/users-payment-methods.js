/**
 * Users Payment Methods Schema
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
  definition.name = 'users_payment_methods';

  definition.schema = {
    id: {
      type: types.serial
    , unique: true
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'NOW()'
    }
  , user_id: {
      type: types.int
    , nullable: false
    , references: {table: 'users', column: 'id', onDelete: 'cascade'}
    }
  , payment_method_id: {
      type: types.int
    , references: {table: 'payment_methods', column: 'id', onDelete: 'cascade'}
    , nullable: false
    }
  , name: {
      type: types.text
    , nullable: true
    }
  , ordrin_card_id: { type: types.text, unique: true }
  };

  definition.indices = {};

  definition.extras = ['PRIMARY KEY ("user_id", "payment_method_id")'];

  return definition;
});
