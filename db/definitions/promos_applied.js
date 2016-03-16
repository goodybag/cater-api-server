/**
 * Promos Applied Schema
 */

if (typeof module === 'object' && typeof define !== 'function') {
 var define = function (factory) {
   module.exports = factory(require, exports, module);
 };
}

var types = require('../data-types');

define(function(require) {
  var definition = {};
  definition.name = 'promos_applied';

  definition.schema = {
    id: {
      type: types.serial
    , pk: true
    }
  , promo_id: {
      type: types.citext
    , nullable: false
    , references: {
        table: 'promos'
      , column: 'promo_code'
      , onDelete: 'cascade'
      }
    }
  , order_id: {
      type: types.int
    , nullable: false
    , references: {
        table: 'orders'
      , column: 'id'
      , onDelete: 'cascade'
      }
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'now()'
    }
  };

  definition.indices = { };

  return definition;
});
