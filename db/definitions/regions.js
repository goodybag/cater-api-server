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
    id:           { type: types.serial, pk: true }
  , name:         { type: types.text, nullable: false, unique: true }
  , timezone:     { type: types.text, nullable: false, default: 'America/Chicago' }
  };

  definition.indices = {};

  return definition;
});
