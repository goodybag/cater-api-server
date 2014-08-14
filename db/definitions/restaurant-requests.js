/**
 * Restaurant Requests Schema
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
  definition.name = 'restaurant_requests';

  definition.schema = {
    id:                   { type: types.serial, pk: true }
  , contact_name:         { type: types.text }
  , contact_email:        { type: types.text }
  , contact_phone:        { type: types.text }
  , restaurant_name:      { type: types.varchar(10), checks: ["SIMILAR TO '[[:digit:]]{10}'"] }
  };

  return definition;
});
