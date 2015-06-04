/**
 * Stripe Events Schema
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
  definition.name = 'stripe_events';

  definition.schema = {
    id:                   { type: types.serial, pk: true }
  , data:                 { type: types.json, nullable: false }
  };

  definition.indices = {};

  return definition;
});
