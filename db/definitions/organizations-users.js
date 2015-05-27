/**
 * Organizations Users Schema
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
  definition.name = 'organizations_users';

  definition.schema = {
    organization_id:      { type: types.int , nullable: false
                          , references: { table: 'organizations', column: 'id' }
                          , onDelete: 'cascade'
                          }
  , user_id:              { type: types.int , nullable: false
                          , references: { table: 'users', column: 'id' }
                          , onDelete: 'cascade'
                          }
  , created_at:           { type: types.timestamp, nullable: false, default: 'now()' }
  };

  definition.indices = {};

  definition.extras = ['primary key ("organization_id", "user_id")'];

  return definition;
});
