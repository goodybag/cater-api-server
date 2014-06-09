/**
 * Regions Schema
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
  definition.name = 'regions';

  definition.schema = {
    id:                 { type: types.serial, pk: true }
  , name:               { type: types.text, nullable: false, unique: true }
  , state:              { type: types.text, nullable: false }
  , cities:             { type: types.array( types.text ), nullable: false, default: 'Array[]::text[]' }
  , timezone:           { type: types.text, nullable: false }
  , sales_tax:          { type: types.numeric( 5, 5 ), nullable: false, default: 0 }
  , lead_time_modifier: { type: types.int, nullable: false, default: 0 }
  };

  definition.indices = {};

  return definition;
});
