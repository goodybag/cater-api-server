/**
 * Restaurants Schema
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
  definition.name = 'restaurants';

  definition.schema = {
    id: {
      type: types.serial
    , pk: true
    }
  , text_id: {
      type: types.text
    , unique: true
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'NOW()'
    }
  , name: {
      type: types.text
    , nullable: false
    , editable: ['client', 'admin']
    }
  , street: {
      type: types.text
    , nullable: false
    , editable: ['client', 'admin']
    }
  , street2: {
      type: types.text
    , nullable: true
    }
  , city: {
      type: types.text
    , nullable: false
    , editable: ['client', 'admin']
    }
  , state: {
      type: types.varchar(2)
    , nullable: false
    , editable: ['client', 'admin']
    }
  , zip: {
      type: types.varchar(5)
    , nullable: true
    , checks: ["SIMILAR TO '[[:digit:]]{5}'"]
    , editable: ['client', 'admin']
    }
  , display_phone: {
      type: types.varchar(10)
    , nullable: true
    , editable: ['client', 'admin']
    }
  , minimum_order: {
      type: types.int
    , nullable: true
    , checks: ['> 0']
    , editable: ['client', 'admin']
    }
  , price: {
      type: types.smallint
    , checks: [ '> 0', '<= 5']
    , nullable: false
    , editable: ['client', 'admin']
    }
  , delivery_instructions: {
      type: types.text
    , nullable: true
    }
  , cuisine: {
      type: types.array(types.text)
    , nullable: true
    , editable: ['client', 'admin']
    }
  , is_hidden: {
      type: types.boolean
    , nullable: false
    , default: true
    , editable: ['admin']
    }
  , logo_url: {
      type: types.text
    , editable: ['client', 'admin']
    }
  , logo_mono_url: {
      type: types.text
    , editable: ['client', 'admin']
    }
  , list_photo_url: {
      type: types.text
    }
  , balanced_customer_uri: {
      type: types.text
    , nullable: true // even if there is no payment method specified this is good to have because this is whom the transaction is done on behalf of when we debit a customer's card or bank, will allow null, but should change to not null in future and generate uri on restaurant creation
    , unique: true
    }
  , payment_method_id: {
      type: types.int
    , nullable: true // this is null is they don't want direct deposits
    , default: 'NULL'
    , references: {table: 'payment_methods', column: 'id', onDelete: 'set null'}
    }
  , yelp_business_id: {
      type: types.text
    , editable: ['client', 'admin']
    }
  , description: {
      type: types.text
    , editable: ['client', 'admin']
    }
  , websites: {
      type: types.array(types.text)
    , editable: ['client', 'admin']
    }
  , billing_email: {
      type: types.text
    , editable: ['client', 'admin']
    }
  , billing_street: {
      type: types.text
    , editable: ['client', 'admin']
    }
  , billing_street2: {
      type: types.text
    , editable: ['client', 'admin']
    }
  , billing_city: {
      type: types.text
    , editable: ['client', 'admin']
    }
  , billing_state: {
      type: types.varchar(2)
    , editable: ['client', 'admin']
    }
  , billing_zip: {
      type: types.varchar(2)
    , editable: ['client', 'admin']
    }
  , gb_fee: {
      type: types.numeric(5,5)
    , nullable: false
    , default: 0.1275
    , editable: ['client', 'admin']
    }
  , is_direct_deposit: {
      type: types.boolean
    , nullable: false
    , default: true
    , editable: ['client', 'admin']
    }
  , is_fee_on_total: {
      type: types.boolean
    , nullable: false
    , default: true
    , editable: ['client', 'admin']
    }
  , is_archived: {
      type: types.boolean
    , nullable: false
    , default: false
    , editable: ['admin']
    }
  , is_featured: {
      type: types.boolean
    , nullable: false
    , default: false
    , editable: ['admin']
    }
  , region_id: {
      type: types.int
    , references: {table: 'regions', column: 'id', onDelete: 'set null'}
    , editable: ['client', 'admin']
    }
  , delivery_service_order_amount_threshold: {
      type: types.int
    , nullable: false
    , default: 0
    , editable: ['client', 'admin']
    }
  , delivery_service_order_total_upperbound: {
      type: types.int
    , nullable: false
    , default: 0
    , editable: ['client', 'admin']
    }
  , delivery_service_head_count_threshold: {
      type: types.int
    , nullable: false
    , default: 0
    , editable: ['client', 'admin']
    }
  , pms_contact_id: {
      type: types.int
    , references: {table: 'contacts', column: 'id', onDelete: 'set null'}
    }
  , search_vector: {
      type: types.tsvector
    }
  , has_contract: {
      type: types.boolean
    , default: false
    }
  , disable_courier_notifications: {
      type: types.boolean
    , default: false
    }
  , no_contract_fee: {
      type: types.numeric(5,5)
    , nullable: false
    , default: 0
    }
  , plan_id: {
      type: types.int
    , references: { table: 'restaurant_plans', column: 'id', onDelete: 'set null' }
    }
  , popularity: {
      type: types.numeric(1,1)
    , default: 0
    , checks: ['popularity <= 1']
    }
  , supported_order_types: {
      type: types.array(types.order_type)
    , default: "Array['pickup', 'courier', 'delivery']::order_type[]"
    }
  , stripe_id: { type: types.text }
  , uuid: {
      type: types.uuid
    , nullable: false
    , default: "uuid_generate_v4()"
    }
  , collect_payments: {
      type: types.boolean
    , default: false
    }
  };

  definition.indices = {};

  return definition;
});
