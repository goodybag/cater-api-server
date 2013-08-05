/**
 * Orders Schema
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
  definition.name = 'orders';

  definition.schema = {
    id: {
      type: types.serial
    , pk: true
    }
  , created_at: {
      type: types.timestamp
    , nullable: false
    , default: 'NOW()'
    }
  , user_id: {
      type: types.int
    , nullable: false
    , references: {table: 'users', column: 'id'}
    }
  , restaurant_id: {
      type: types.int
    , nullable: false
    , references: {table: 'restaurants', column: 'id'}
    }
  , street: {
      type: types.text
    , nullable: false
    }
  , city: {
      type: types.text
    , nullable: false
    }
  , state: {
      type: types.varchar(2)
    , nullable: false
    }
  , zip: {
      type: types.numeric(5)
    , nullable: true
    }
  , phone: {
      type: types.numeric(10)
    , nullable: false
    }
  , notes: {
      type: types.text
    , nullable: true
    }
  , datetime: {
      type: types.timestamp
    , nullable: false
    }
  , guests: {
      type: types.int
    , nullable: false
    }
  };

  definition.indices = {};

  return definition;
});
