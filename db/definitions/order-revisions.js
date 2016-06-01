/**
 * Order Revisions
 */

var types = require('../data-types');
var orderRecord = require('../../lib/order-record');

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
var dirac = require('dirac');
definition.extras = [];


definition.track = function( orderId, actorId, desc, callback ){
  callback = callback || function(){};
  if ( typeof desc === 'string' ){
    desc = { description: desc, details: {} };
  }

  orderRecord.generate( orderId, function( error, data ){
    if ( error ){
      return callback( error);
    }

    var doc = {
      order_id: data.id
    , user_id: data.user_id
    , actor_id: actorId
    , description: desc.description
    , details: JSON.stringify( desc.details )
    , data: JSON.stringify( data )
    };

    this.insert( doc, callback );
  }.bind(this));
};
