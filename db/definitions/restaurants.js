/**
 * Users Schema
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
      type: types.timestamp
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
    , nullable: false
    }
  , phone: {
      type: types.numeric(10)
    , nullable: false
    }
  , price: {
      type: types.smallint
    , checks: [ '> 0', '<= 5']
    , nullable: false
    }
  , delivery_fee {
      type: types.int
    , nullable: false
    , default: 0
    , checks: ['>= 0']
    }
  };

  definition.indices = {};

  return definition;
});
