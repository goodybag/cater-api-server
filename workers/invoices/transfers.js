var db = require('../../db');
var config = require('../../config');
var utils = require('../../utils');
var OrderTransfer = require('../../public/js/app/stamps/orders/transfer');
var EnumStream = require('../../lib/enum-stream');
var logger = require('../../lib/logger').create('InvoiceTransfers-Worker');

db.orders.findStream(
  { 'orders.payment_method_id': { $null: true }
  , 'orders.status': 'accepted'
  , 'successful_transfers.id': { $null: true }
  , 'datetime': {
      $older_than: { value: 3, unit: 'hours', nowTimezone: 'orders.timezone' }
    , $custom: [
        'orders.datetime >= $1 at time zone orders.timezone'
      , config.invoice.transfersWorkerStartDate
      ]
    }
  , 'restaurants.plan_id': { $notNull: true }
  , 'restaurants.is_direct_deposit': true
  }
, { with:   [ { name: 'successful_transfers'
              , type: 'select'
              , table: 'invoiced_order_payment_transfers'
              , distinct: ['order_id']
              , where: {
                  error: { $null: true }
                }
              , order: ['order_id desc', 'id desc']
              }
            ]
  , columns: [ 'orders.*' ]
  , joins:  [ { type: 'left'
              , target: 'successful_transfers'
              , on: { order_id: '$orders.id$' }
              }
            , { type: 'left'
              , target: 'restaurants'
              , on: { id: '$orders.restaurant_id$' }
              }
            ]
  , one: [ { table: 'restaurants', alias: 'restaurant'
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
  }
, ( error, results )=>{
    if ( error ){
      logger.error('Error fetching initial results', { error });
      return process.exit(1);
    }

    EnumStream
      .create( results, { concurrency: 5 } )
      // Filter out accounts that don't have transfers enabled
      .filterAsync( ( order, next )=>{
        var id = order.restaurant.stripe_id;

        utils.stripe.accounts.retrieve( id, ( error, account )=>{
          if ( error ){
            error.order_id = order.id;
            error.restaurant_id = order.restaurant_id;
            return next( error );
          }

          return next( null, !!account.transfers_enabled );
        })
      })
      .map( order => OrderTransfer.create({ order }) )
      .mapAsync( ( transfer, next )=> transfer.send( next ) )
      .errors( ()=> process.stdout.write('x') )
      .forEach( transfer => process.stdout.write('.') )
      .errors( error => logger.error('Transfer error', { error }) )
      .end( ()=> process.exit(0) );
  }
);
