/**
 * Restaurant Signups Schema
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
  definition.name = 'restaurant_signups';

  definition.schema = {
    id: {
      type: types.serial
    , pk: true
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'NOW()'
    }
  , restaurant_id: {
      type: types.int
    , nullable: true
    , references: {table: 'restaurants', column: 'id', onDelete: 'cascade'}
    }
  , data: {
      type: types.json  
    }
  , status: {
      type: types.signup_status 
    , nullable: false
    , default: "'pending'"
    }
  , step: {
      type: types.int
    , nullable: false
    , default: 1
    }

  };

  definition.indices = {};

  return definition;
});
