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
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'NOW()'
    }
  , name: {
      type: types.text
    , nullable: false
    }
  , street: {
      type: types.text
    , nullable: false
    }
  , street2: {
      type: types.text
    , nullable: true
    }
  , city: {
      type: types.text
    , nullable: false
    }
  , state: {
      type: types.varchar(2)
    , nullable: false
    }
  , zip: {
      type: types.varchar(5)
    , nullable: true
    , checks: ["SIMILAR TO '[[:digit:]]{5}'"]
    }
  , display_phone: {
      type: types.varchar(10)
    , nullable: true
    }
  , minimum_order: {
      type: types.int
    , nullable: true
    , checks: ['> 0']
    }
  , price: {
      type: types.smallint
    , checks: [ '> 0', '<= 5']
    , nullable: false
    }
  , delivery_instructions: {
      type: types.text
    , nullable: true
    }
  , cuisine: {
      type: types.array(types.text)
    , nullable: true
    }
  , is_hidden: {
      type: types.boolean
    , nullable: false
    , default: true
    }
  , logo_url: {
      type: types.text
    }
  , logo_mono_url: {
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
    }
  , description: {
      type: types.text
    }
  , websites: {
      type: types.array(types.text)
    , nullable: false
    }
  };

  definition.indices = {};

  return definition;
});
