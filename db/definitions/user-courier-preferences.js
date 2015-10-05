/**
 * Order Notifications Schema
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
  definition.name = 'user_courier_preferences';

  definition.schema = {
    user_id: { type: types.int, references: { table: 'users', column: 'id', onDelete: 'cascade' } }
  , delivery_service_id: { type: types.int, references: { table: 'delivery_services', column: 'id', onDelete: 'cascade' } }
  };

  definition.indices = {};
  definition.extras = ['primary key (user_id, delivery_service_id)'];

  return definition;
});
