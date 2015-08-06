/**
 * Organizations Schema
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
  definition.name = 'organizations';

  definition.schema = {
    id:                   { type: types.serial, nullable: false, pk: true }
  , name:                 { type: types.text , nullable: false }
  , created_at:           { type: types.timestamp, nullable: false, default: 'now()' }
  };

  definition.indices = {};

  return definition;
});
