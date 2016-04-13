var db = require('../../db');
var EnumStream = require('../../lib/flow-stream');

db.orders.findStream(
  { 'orders.payment_method': { $null: true }
  ,
  }
, { with:   [ { name: 'successful_transfers'
              , type: 'select'
              , table: 'invoiced_order_payment_transfers'
              , distinct: ['order_id']
              , where: {
                  error: { $null: true }
                }
              , order: { id: 'desc' }
              }
            ]
  , joins:  [ { type: 'left'
              , target: 'successful_transfers'
              , on: { order_id: '$orders.id$' }
              }
            ]
  }
, ( error, results )=>{

  }
)
