/**
 * User Drivers Schema
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
  definition.name = 'user_drivers';

  definition.schema = {
    id:                 { type: types.serial, pk: true }
  , user_id:            { type: types.serial
                        , nullable: false
                        , references: { table: 'users', column: 'id', onDelete: 'cascade' }
                        }
  };

  definition.indices = {};

  return definition;
});
