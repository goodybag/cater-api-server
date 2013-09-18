/**
 * Options Set Schema
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
  definition.name = 'options_sets';

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
  , item_id: {
      type: types.int
    , nullable: false
    , references: {table: 'items', column: 'id'}
    }
  , name: {
      type: types.text
    , nullable: true
    }
  , type: {
      type: types.optionsettype
    , nullable: false
    , default: "'checkbox'"
    }
  };

  definition.indices = {};

  return definition;
});
