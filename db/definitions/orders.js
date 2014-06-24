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
  , uuid: {
      type: types.uuid
    , nullable: false
    , default: "uuid_generate_v1()"
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
  , street2: {
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
  , pickup_datetime: {
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
  , edit_token: {
      type: types.text
    , nullable: true
    }
  , edit_token_expires: {
      type: types.timestamp
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
  , tip_percent: {
      type: types.tippercentage
    , nullable: true
    ,
    }
  , name: {
      type: types.text
    , nullable: true
    }
  , delivery_instructions: {
      type: types.text
    , nullable: true
    }
  , status: {
      type:types.orderstatus
    , nullable: false
    , default: "'pending'"
    }
  , cut: {
      type: types.int
    , nullable: true // change this to false once we handle the existing data
    }
  , payment_status: {
      type: types.paymentstatus
    , nullable: true
    }
  , payment_method_id: {
      type: types.int
    , nullable: true
    , references: {table: 'payment_methods', column: 'id'}
    }
  , reason_denied: {
      type: types.text
    , nullable: true
    }
  , reviewed: {
      type: types.boolean
    , nullable: false
    , default: false
    }
  , points_awarded: {
      type: types.boolean
    , default: false
    }
  , sales_tax: {
      type: types.int
    , nullable: false
    , default: 0
    }
  , delivery_fee: {
      type: types.int
    , nullable: false
    , default: 0
    }
  , total: {
      type: types.int
    , nullable: false
    , default: 0
    }
  , is_delivery: { type: types.boolean, nullable: false, default: false }
  , is_pickup: { type: types.boolean, nullable: false, default: false }
  , is_delivery_service: { type: types.boolean, nullable: false, default: false }
  };

  definition.indices = {};

  return definition;
});
