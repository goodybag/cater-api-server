/**
 * Restaurants Schema
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
  definition.name = 'restaurants';

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
  , name: {
      type: types.text
    , nullable: false
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
  , sms_phone: {
      type: types.varchar(10)
    , nullable: true
    , checks: ["SIMILAR TO '[[:digit:]]{10}'"]
    }
  , voice_phone: {
      type: types.varchar(10)
    , nullable: true
    , checks: ["SIMILAR TO '[[:digit:]]{10}'"]
    }
  , email: {
      type: types.text
    , nullable: false
    }
  , minimum_order: {
      type: types.int
    , nullable: true
    , checks: ['> 0']
    }
  , price: {
      type: types.smallint
    , checks: [ '> 0', '<= 5']
    , nullable: false
    }
  , delivery_fee: {
      type: types.int
    , nullable: false
    , default: 0
    , checks: ['>= 0']
    }
  , delivery_instructions {
      type: types.text
    , nullable: true
    }
  , cuisine: {
      type: types.text + '[]'
    , nullable: true
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
