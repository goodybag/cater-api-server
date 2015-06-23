/**
 * Addresses Schema
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
  definition.name = 'addresses';

  definition.schema = {
    id: {
      type: types.serial
    , nullable: false
    , unique: true
    }
  , user_id: {
      type: types.int
    , nullable: false
    , references: {table: 'users', column: 'id'}
    }
  , name: {
      type: types.text
    , nullable: true
    }
  , street: {
      type: types.text
    , nullable: false
    }
  , street2: {
      type: types.text
    , nullable: false
    , default: "''"
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
      type: types.varchar(5)
    , nullable: false
    }
  , is_default: {
      type: types.bool
    , nullable: false
    }
  , phone: {
      type: types.varchar(10)
    , nullable: false
    , checks: ["SIMILAR TO '[[:digit:]]{10}'"]
    }
  , delivery_instructions: {
      type: types.text
    , nullable: true
    }
  , lat_lng: { type: types.point }
  };

  definition.indices = {};

  definition.extras = ['PRIMARY KEY ("user_id", "street", "street2", "zip")'];

  return definition;
});
