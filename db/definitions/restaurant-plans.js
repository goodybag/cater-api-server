/**
 * Restaurant Plans Schema
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
  definition.name = 'restaurant_plans';

  definition.schema = {
    id:                 { type: types.serial, pk: true }
  , type:               { type: types.plan_type, nullable: false, default: "'tiered'" }
  , name:               { type: types.text }
  , data:               { type: types.json, nullable: false, default: "'{}'" }
  , created_at:         { type: types.timestamp, default: 'now()' }
  };

  definition.indices = {};

  return definition;
});
