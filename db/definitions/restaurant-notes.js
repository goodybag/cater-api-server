/**
 * Restaurant Photos Types Schema
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
  definition.name = 'restaurant_notes';

  definition.schema = {
    id: {
      type: types.serial
    , nullable: false
    , unique: true
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'NOW()'
    }
  , restaurant_id: {
      type: types.int
    , nullable: false
    , references: { table: 'restaurants', column: 'id', onDelete: 'cascade' }
    }
  , user_id: {
      type: types.int
    , nullable: false
    , references: { table: 'users', column: 'id', onDelete: 'cascade' }
    }
  , note: {
      type: types.text
    }
  };

  definition.indices = {};

  return definition;
});
