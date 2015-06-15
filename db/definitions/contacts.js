/**
 * Contacts Schema
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
  definition.name = 'contacts';

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
  , restaurant_id: {
      type: types.int
    , nullable: false
    , references: {
        table: 'restaurants'
      , column: 'id'
      }
    }
  , name: {
      type: types.text
    , nullable: false
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
  , notify: {
      type: types.boolean
    , nullable: false
    , default: false
    }
  , notes: {
      type: types.text
    }
  , disable_sms: {
      type: types.boolean
    , nullable: false
    , default: false
    }
  };

  definition.indices = {};

  return definition;
});
