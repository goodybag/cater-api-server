/**
 * Features Users Schema
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
  definition.name = 'features_users';

  definition.schema = {
    user_id: {
      type: types.int
    , nullable: false
    , references: {table: 'users', column: 'id', onDelete: 'cascade'}
    }
  , feature_id: {
      type: types.citext
    , references: {table: 'features', column: 'id', onDelete: 'cascade'}
    , nullable: false
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'NOW()'
    }
  , data: {
      type: types.json
    , nullable: false
    , default: "'{}'"
    }
  };

  definition.indices = {};

  definition.extras = ['PRIMARY KEY ("user_id", "feature_id")'];

  return definition;
});
