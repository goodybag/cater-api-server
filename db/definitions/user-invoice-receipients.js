/**
 * User Invoice Receipients Schema
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
  definition.name = 'user-invoice-recipients';

  definition.schema = {
    user_id: {
      type: types.int
    , nullable: false
    , references: {table: 'users', column: 'id'}
    }
  , name: {
      type: types.text
    , nullable: false
    }
  , email: {
      type: types.text
    , nullable: false
    }
  };

  definition.indices = {};

  return definition;
});
