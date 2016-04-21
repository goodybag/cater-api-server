/**
 * Order Revisions
 */

var dirac = require('dirac');
var types = require('../data-types')

var definition = module.exports;

definition.name = 'order_revisions';

definition.schema = {
  id:                   { type: types.serial, pk: true }
, order_id:             { type: types.int, nullable: false
                        , references: { table: 'orders', column: 'id' }
                        , onDelete: 'cascade'
                        }
  // For extra indexing and ease of lookup
, user_id:              { type: types.int
                        , references: { table: 'users', column: 'id' }
                        , onDelete: 'set null'
                        }
  // User who initiated the revision
, actor_id:             { type: types.int
                        , references: { table: 'users', column: 'id' }
                        , onDelete: 'set null'
                        }
  // Something we can use to identify what category of change occurred
  // Eventually, we may want to make this an enum type
  // like (add_item, remove_item, update_quantity, etc.)
, description:          { type: types.text }
, data:                 { type: types.jsonb, nullable: false, default: "'{}'::jsonb" }
, details:              { type: types.jsonb, nullable: false, default: "'{}'::jsonb" }
, created_at:           { type: types.timestamp, nullable: false, default: 'now()' }
};

definition.indices = {};
definition.extras = [];


definition.track = function( orderId, actorId, description, callback ){
  callback = callback || function(){};

  var options = {
    one:  [ { table: 'restaurants', alias: 'restaurant'
            , columns: ['*']
            , one:  [ { table: 'restaurant_plans', alias: 'plan' }
                    , { table: 'regions', alias: 'region' }
                    ]
            }
          , { table: 'users', alias: 'user' }
          , { table: 'payment_methods'
            , alias: 'payment_method'
            , columns: ['payment_methods.*', 'users_payment_methods.name']
            , joins:  [ { type: 'left'
                        , target: 'users_payment_methods'
                        , on: { 'payment_method_id': '$payment_methods.id$' }
                        }
                      ]
            }
          ]
  , many: [ { table: 'order_items', alias: 'items' }
          , { table: 'order_amenities', alias: 'amenities'
            , mixin: [{ table: 'amenities' }]
            }
          ]
  };

  dirac.dals.orders.findOne( orderId, options, function( error, order ){
    if ( error ){
      return callback( error );
    }

    var doc = {
      order_id: order.id
    , user_id: order.user_id
    , actor_id: actorId
    , description: description
    , data: JSON.stringify( order )
    };

    this.insert( doc, callback );
  }.bind( this ));
};
