/**
 * Scheduled Jobs Schema
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
  definition.name = 'scheduled_jobs';

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
  , action: {
      type: types.text
    }
  , data: {
      type: types.json
    }
  , status: {
      type: types.jobstatus
    }
  , datetime: {
      type: types.timestamptz
    }
  , predicate_id: {
      type: types.int
    , references: { table: 'scheduled_jobs', column: 'id' }
    }
  };

  definition.indices = {};

  return definition;
});
