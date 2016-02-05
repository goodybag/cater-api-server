/**
 * Features schema
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
  definition.name = 'features';

  definition.schema = {
    id: {
      type: types.citext
    , nullable: false
    , unique: true
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'now()'
    }
  , name: {
      type: types.text
    , nullable: false
    }
  , rollout_at: {
      type: types.timestamptz
    , nullable: false
    , default: "'1970-01-01T00:00:00Z'"
  }
  , restaurant_id: {
      type: types.int
    , nullable: false
    , references: {
        table: 'restaurants'
      , column: 'id'
      , onDelete: 'cascade'
      }
    }
  };

  definition.indices = {};

  return definition;
});
