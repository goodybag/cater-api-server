/**
 * Groups Schema
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
  definition.name = 'deltas';

  definition.schema = {
    id: { type: 'serial', pk: true }
  , version: { type: 'text' }
  , date: { type: 'timestamp', default: 'now()'}
  };

  definition.indices = {};

  return definition;
});
