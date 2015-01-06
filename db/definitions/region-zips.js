/**
 * Region Zips Schema
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
  definition.name = 'region_zips';

  definition.schema = {
    id:          { type: types.serial, pk: true }
  , region_id:   { type: types.int, notNull: true, references: { table: 'regions', column: 'id' } }
  , zip:         { type: types.varchar(5), notNull: true }
  , created_at:  { type: types.timestamp, default: 'now()' }
  };

  definition.indices = {};

  return definition;
});
