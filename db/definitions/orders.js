/**
 * Orders Schema
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
  definition.name = 'orders';

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
  , user_id: {
      type: types.int
    , nullable: false
    , references: {table: 'users', column: 'id'}
    }
  , restaurant_id: {
      type: types.int
    , nullable: false
    , references: {table: 'restaurants', column: 'id', onDelete: 'set null'}
    }
  , street: {
      type: types.text
    , nullable: true
    }
  , city: {
      type: types.text
    , nullable: true
    }
  , state: {
      type: types.varchar(2)
    , nullable: true
    }
  , zip: {
      type: types.varchar(5)
    , nullable: true
    , checks: ["SIMILAR TO '[[:digit:]]{5}'"]
    }
  , phone: {
      type: types.varchar(10)
    , nullable: true
    , checks: ["SIMILAR TO '[[:digit:]]{10}'"]
    }
  , notes: {
      type: types.text
    , nullable: true
    }
  , datetime: {
      type: types.timestamp
    , nullable: true
    }
  , timezone: {
      type: types.timezone
    , nullable: true
    , default:"'America/Chicago'" //TODO: determine timezone based on order info
    }
  , guests: {
      type: types.int
    , nullable: true
    }
  , review_token: {
      type: types.text
    , nullable: false
    }
  , token_used: {
      type: types.timestamp
    , nullable: true
    }
  , adjustment_amount: {
      type: types.int
    , nullable: true
    }
  , adjustment_description: {
      type: types.text
    , nullable: true
    }
  , tip: {
      type: types.int
    , nullable: false
    , default: 0
    }
  , name: {
      type: types.text
    , nullable: true
    }
  , cut: {
      type: types.int
    , nullable: true // change this to false once we handle the existing data
    }
  , payment_status: {
      type: types.paymentstatus
    , nullable: true
    }
  , payment:_method_id: {
      type: types.int
    , nullable: true
    , references: {table: 'payment_method', column: 'id', onDelete: 'set null'}
    }
  };

  definition.indices = {};

  return definition;
});
