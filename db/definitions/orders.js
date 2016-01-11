/**
 * Orders Schema
 */

if (typeof module === 'object' && typeof define !== 'function') {
  var define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

var
  types   = require('../data-types')
, config  = require('../../config')
, utils   = require('../../utils')
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
    , nullable: true
    , references: {table: 'users', column: 'id'}
    }
  , restaurant_id: {
      type: types.int
    , nullable: false
    , references: {table: 'restaurants', column: 'id', onDelete: 'set null'}
    }
  , address_name: { type: types.text, editable: ['client', 'admin'] }
  , street: {
      type: types.text
    , nullable: true
    , editable: ['client', 'admin'] // some sort of access control list
    }
  , street2: {
      type: types.text
    , nullable: true
    , editable: ['client', 'admin']
    }
  , city: {
      type: types.text
    , nullable: true
    , editable: ['client', 'admin']
    }
  , state: {
      type: types.varchar(2)
    , nullable: true
    , editable: ['client', 'admin']
    }
  , zip: {
      type: types.varchar(5)
    , nullable: true
    , checks: ["SIMILAR TO '[[:digit:]]{5}'"]
    , editable: ['client', 'admin']
    }
  , phone: {
      type: types.varchar(10)
    , nullable: true
    , checks: ["SIMILAR TO '[[:digit:]]{10}'"]
    , editable: ['client', 'admin']
    }
  , notes: {
      type: types.text
    , nullable: true
    , editable: ['client', 'admin']
    }
  , datetime: {
      type: types.timestamp
    , nullable: true
    , editable: ['client', 'admin']
    }
  , pickup_datetime: {
      type: types.timestamp
    , nullable: true
    }
  , promo_code: {
      type: types.text
    , nullable: true
    , editable: ['client', 'admin']
    }
  , timezone: {
      type: types.timezone
    , nullable: true
    , default:"'America/Chicago'" //TODO: determine timezone based on order info
    , editable: ['client', 'admin']
    }
  , guests: {
      type: types.int
    , nullable: true
    , editable: ['client', 'admin']
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
  , ds_token: {
      type: types.text
    , nullable: true
    }
  , ds_token_used: {
      type: types.timestamp
    , nullable: true
    }
  , token_used: {
      type: types.timestamp
    , nullable: true
    }
  , adjustment_amount: {
      type: types.int
    , nullable: true
    , editable: ['admin']
    }
  , adjustment_description: {
      type: types.text
    , nullable: true
    , editable: ['admin']
    }
  , tip: {
      type: types.int
    , nullable: false
    , default: 0
    , editable: ['client', 'admin']
    }
  , tip_percent: {
      type: types.tippercentage
    , nullable: true
    , editable: ['client', 'admin']
    }
  , name: {
      type: types.text
    , nullable: true
    , editable: ['client', 'admin']
    }
  , delivery_instructions: {
      type: types.text
    , nullable: true
    , editable: ['client', 'admin']
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
    , editable: ['order-owner', 'admin']
    }
  , payment_method_id: {
      type: types.int
    , nullable: true
    , references: {table: 'payment_methods', column: 'id'}
    , editable: ['client', 'admin']
    }
  , reason_denied: {
      type: types.text
    , nullable: true
    , editable: ['admin', 'order-restaurant']
    }
  , reviewed: {
      type: types.boolean
    , nullable: false
    , default: false
    , editable: ['client', 'admin']
    }
  , points_awarded: {
      type: types.boolean
    , default: false
    }
  , sales_tax: {
      type: types.int
    , nullable: false
    , default: 0
    , editable: []
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
    , editable: []
    }
  , search_vector: {
      type: types.tsvector
    }
  , type: { type: types.order_type, nullable: false, default: '\'delivery\'::order_type', editable: ['client', 'admin'] }
  , sub_total: { type: types.int, nullable: false, default: 0, editable: ['client', 'admin']}
  , user_adjustment_amount: { type: types.int, nullable: false, default: 0, editable: ['admin'] }
  , user_adjustment_description: { type: types.text, nullable: true, editable: ['admin'] }
  , delivery_service_id: { type: types.int, references: { table: 'delivery_services', column: 'id' } }
  , restaurant_total: { type: types.int, nullable: false, default: 0, editable: [] }
  , restaurant_sales_tax: { type: types.int, nullable: false, default: 0, editable: [] }
  , restaurant_location_id: { type: types.int, references: { table: 'restaurant_locations', column: 'id' } }
  , secondary_contact_phone: {
      type: types.varchar(10)
    , nullable: true
    , checks: ["SIMILAR TO '[[:digit:]]{10}'"]
    , editable: ['client', 'admin']
    }
  , lat_lng: { type: types.point, editable: ['order-owner'] }
  , priority_account_price_hike_percentage: {
      type: types.numeric( 5, 5 )
    , notNull: true
    , default: 0
    }
  , courier_tracking_id: { type: types.text }
  , organization_id: { type: types.int, references: { table: 'organizations', column: 'id' } }
  };

  definition.indices = {};

  definition.findWithPendingPoints = function( $where, $options, callback ){
    utils.enforceRequired( $where, [
      'user_id'
    ]);

    $where = utils.defaults( $where, {
      status:         { $or: ['submitted', 'accepted', 'delivered'] }
    , points_awarded: false
    , created_at:     { $gte: config.rewardsStartDate }
    });

    return this.find( $where, $options, callback );
  };

  return definition;
});
