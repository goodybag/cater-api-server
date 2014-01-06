/**
 * Locations Schema
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
  definition.name = 'locations';

  definition.schema = {
    id: {
      type: types.serial
    , pk: true
    }
  , restaurant_id: {
      type: types.int
    , references: { table: 'restaurants', column: 'id', onDelete: 'cascade' }
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'NOW()'
    }
  , name: {
      type: types.text
    , nullable: false
    }
  , lat: {
      type: types.double
    , default: '0'
    }
  , lon: {
      type: types.double
    , default: '0'
    }
  , street: {
      type: types.text
    , nullable: false
    }
  , street2: {
      type: types.text
    , nullable: true
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
    , nullable: true
    , checks: ["SIMILAR TO '[[:digit:]]{5}'"]
    }
  , sms_phones: {
      type: types.array(types.varchar(10))
    , nullable: false
    }
  , voice_phones: {
      type: types.array(types.varchar(10))
    , nullable: false
    }
  , emails: {
      type: types.array(types.text)
    , nullable: false
    }
  , is_hidden: {
      type: types.boolean
    , nullable: false
    , default: true
    }
  };

  definition.indices = {};

  return definition;
});
