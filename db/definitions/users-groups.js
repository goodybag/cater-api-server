/**
 * User Groups Schema
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
  definition.name = 'users_groups';

  definition.schema = {
    user_id: {
      type: types.int
    , references: {table: 'users', column: 'id'}
    }
  , group: {
      type: types.text
    , references: {table: 'groups', column: 'name'}
    }
  };

  definition.indices = {};

  definition.extras = ['PRIMARY KEY ("user_id", "group")'];

  return definition;
});
