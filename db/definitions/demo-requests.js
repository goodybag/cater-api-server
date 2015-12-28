/**
 * Demo Requests Schema
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
  definition.name = 'demo_requests';

  definition.schema = {
    id:                 { type: types.serial, pk: true }
  , region_id:          { type: types.int, references: {table: 'regions', column: 'id'} }
  , created_at:         { type: types.timestamptz, nullable: false, default: 'now()' }
  , preferred_datetime: { type: types.timestamptz, nullable: false }
  , contact_name:       { type: types.text, nullable: false }
  , contact_email:      { type: types.citext, nullable: false }
  , contact_company:    { type: types.text }
  , contact_phone:      { type: types.varchar(10), checks: ["SIMILAR TO '[[:digit:]]{10}'"] }
  };

  return definition;
});
