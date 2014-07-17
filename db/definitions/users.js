/**
 * Users Schema
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
  definition.name = 'users';

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
  , name: {
      type: types.text
    , nullable: true
    }
  , email: {
      type: types.text
    , nullable: false
    , unique: true
    }
  , password: {
      type: types.text
    , nullable: false
    }
  , organization: {
      type: types.text
    , nullable: true
    }
  , balanced_customer_uri: { //can be null if they're going to be invoiced
      type: types.text
    , nullable: true
    , unique: true
    }
  , is_invoiced: {
      type: types.boolean
    , nullable: false
    , default: 'false'
    }
  , points: {
      type: types.int
    , checks: [ '>= 0']
    , default: 0
    }
  , region_id: {
      type: types.int
    , references: {table: 'regions', column: 'id', onDelete: 'set null'}
    }
  , default_zip: {
      type: types.varchar(5)
    }
  , ordrin_email:     { type: types.text, unique: true }
  , ordrin_password:  { type: types.text }
  };

  definition.indices = {};

  return definition;
});
