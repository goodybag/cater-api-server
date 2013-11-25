/**
 * Order Changes Schema
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
  definition.name = 'order_changes';

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
  , order_id: {
      type: types.int
    , nullable: false
    , references: {table: 'orders', column: 'id'}
    }
  , status: {
      type: types.changestatus
    , nullable: false
    , default: 'submitted'
    }
  , change_summaries: {
      type: array(types.text)
    }
  , order_json: {
      type: types.json
    }
  };

  definition.indices = {};

  return definition;
});
