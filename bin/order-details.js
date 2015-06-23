#!/usr/bin/env node

var id = process.argv[2];

if ( !id ) {
  console.log('Usage\n\torder-details [order id]');
  process.exit(0);
}

var db = require('db');
var Table = require('cli-table');
var OrderCharge = require('stamps/orders/charge');
var helpers = require('../public/js/lib/hb-helpers');
var dollars = function(pennies) {
  return '$' + helpers.dollars(pennies);
}

var $options = {
  one: [ { table: 'restaurants', alias: 'restaurant'
         , one: [ { table: 'restaurant_plans', alias: 'plan' }
                , { table: 'regions', alias: 'region' }
                ]
         }
       , { table: 'users', alias: 'user' }
       ]
, many: [ { table: 'order_items', alias: 'items' }
        , { table: 'order_amenities', alias: 'amenities'
          , mixin: [{ table: 'amenities' }]
          }
        ]
};

db.orders.findOne(id, $options, function(err, order) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  var charge = OrderCharge( order );
  var table = new Table({ colAligns: ['left', 'right'] });
  table.push(
    { 'Order ID':         charge.id }
  , { 'Type':             charge.type }
  , { 'Subtotal':         dollars(charge.getSubTotal()) }
  , { 'Delivery Fee':     dollars(charge.delivery_fee) }
  , { 'Tax':              dollars(charge.getTax()) }
  , { 'Tip':              dollars(charge.tip) }
  , { 'Total':            dollars(charge.getTotal()) }
  );

  // Only show app cut for contracted restaurants
  if (charge.plan_id) {
    table.push({ 'Application Cut':  dollars(charge.getApplicationCut()) });
  }

  console.log(table.toString());
  process.exit(0);
});
