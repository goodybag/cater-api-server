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
    id:                 { type: types.int, pk: true
                        , nullable: false
                        , references: { table: 'users', column: 'id', onDelete: 'cascade' }
                        }
  , phone:              { type: types.varchar(10), checks: ["similar to '[[:digit:]]{10}'"] }
  };

  definition.indices = {};

  return definition;
});
