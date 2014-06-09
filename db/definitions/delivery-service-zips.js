/**
 * Delivery Service Zips Schema
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
  definition.name = 'delivery_service_zips';

  definition.schema = {
    id:                   { type: types.serial, pk: true }
  , delivery_service_id:  { type: types.int, references: { table: 'delivery_services', column: 'id', onDelete: 'cascade' } }
  , from:                 { type: types.varchar(5), nullable: false }
  , to:                   { type: types.varchar(5), nullable: false }
  , price:                { type: types.int, default: 0, nullable: false }
  };

  definition.indices = {
    delivery_service_zips_delivery_service_id_from_to_key: {
      type: 'UNIQUE'
    , columns: ['delivery_service_id', 'from', 'to']
    }
  };

  return definition;
});
