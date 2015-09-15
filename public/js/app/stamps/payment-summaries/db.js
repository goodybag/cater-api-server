var db      = require('db');
var utils   = require('utils');
var PMSItem = require('../orders/payment-summary-item');

function getQueryOptions( id ){
  var ordersQuery = {
    table: 'orders'
  , where: {
      status: 'accepted'
    , restaurant_id: {
        $custom: ['orders.restaurant_id = payment_summaries.restaurant_id']
      }
    , datetime: {
        $gte: { $custom: ['orders.datetime >= payment_summaries.period_begin'] }
      , $lt:  { $custom: ['orders.datetime < payment_summaries.period_end'] }
      }
    }
  };

  var options = {
    with: [
      { name: 'oi'
      , type: 'select'
      , table: 'order_items'
      , columns: ['order_items.*']
      , where: {

        }
      , joins: [
          { type: 'left', target: 'orders', on: { id: '$order_items.order_id$' } }
        , { type: 'left', target: 'payment_summaries', on: ordersQuery.where.datetime }
        ]
      }
    ]

  , many: [ ordersQuery
          , { table: 'order_items'
            , where: {
                order_id: { $in: {
                  type: 'select'
                , table: 'orders'
                , where: ordersQuery.where
                } }
              }
            }
          ]

  , one:  [ { table: 'restaurants'
            , alias: 'restaurant'
            }
          ]
  };

  utils.extend( ordersQuery, PMSItem.requiredOrderQueryOptions );

  return options;
}

module.exports = require('stampit')()
  .state({
    orders: []
  })
  .methods({
    fetch: function( callback ){
      if ( !this.id ){
        throw new Error('Invalid ID');
      }

      var options = getQueryOptions();

      db.payment_summaries.findOne( this.id, options, function( error, result ){
        if ( error ) return callback( error );

        this.parseDbResult( result );

        callback( null, this );
      }.bind( this ));

      return this;
    }

  , save: function( callback ){
      if ( this.id ){
        this.saveExisting( callback );
      } else {
        this.saveNew( callback );
      }

      return this;
    }

  , saveNew: function( callback ){
      db.payment_summaries.insert( this, function( error, results ){
        if ( error ) return callback( error );

        this.parseResults( results );
        
        return callback( null, this );
      }.bind( this ));
    }

  , saveExisting: function( callback ){
      db.payment_summaries.update( this.id, this, { returning: ['*'] }, function( error, results ){
        if ( error ) return callback( error );

        this.parseResults( results );

        return callback( null, this );
      }.bind( this ));
    }

  , parseResults: function( results ){
      results = results[0] || results;
      utils.extend( this, this.parseDbResult( results ) );
    }

  , parseDbResult: function( result ){
      if ( result ){
        result.orders = result.orders.map( PMSItem.create );
        utils.extend( this, result );
      }

      return this;
    }
  });

module.exports.getQueryOptions = getQueryOptions;

module.exports.find = function( where, options, callback ){
  if ( typeof options === 'function' ){
    callback = options;
    options = {};
  }

  return db.payment_summaries.find(
    where
  , utils.extend( getQueryOptions(), options )
  , function( error, results ){
      if ( error ) return callback( error );

      results = results.map( function( pms ){
        return module.exports.create().parseDbResult( pms );
      });

      callback( null, results );
    }
  );
};