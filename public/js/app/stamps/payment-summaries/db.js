var mosql   = require('mongo-sql');
var db      = require('db');
var utils   = require('utils');
var errors  = require('errors');
var PMSItem = require('../orders/payment-summary-item');
var pdfs    = require('../../../../../lib/pdfs');
var logger  = require('../../../../../lib/logger').create('PaymentSummary-DB');

module.exports = require('stampit')()
  .compose( require('./base') )
  .state({
    orders: []
  })
  .methods({
    fetch: function( callback ){
      var where = this.getFetchClause();
      var options = this.getQueryOptions();

      db.payment_summaries.findOne( where, options, function( error, result ){
        if ( error ) return callback( error );

        this.parseDbResult( result );

        db.orders.find( {}, this.getOrdersQuery(), function( error, orders ){
          if ( error ) return callback( error );

          // In case payment_summary object wasn't found
          result = result || {};
          result.orders = orders;
          this.parseDbResult( result );

          callback( null, this );
        }.bind( this ));

      }.bind( this ));

      return this;
    }

  , fetchRecipients: function( callback ){
      var where = {
        restaurant_id: this.restaurant_id
      , receives_payment_summaries: true
      };

      db.contacts.find( where, function( error, results ){
        if ( error ){
          return callback( error );
        }

        var recipients = utils.flatten( utils.pluck( results, 'emails') );

        return callback( null, recipients );
      });

      return this;
    }

  , isFetchable: function(){
      return ( !!this.id || (this.restaurant_id && this.period_begin && this.period_end) );
    }

  , getFetchClause: function(){
      if ( !this.isFetchable() ){
        throw new Error('Cannot fetch without `id` or `restaurant_id`, `period_begin`, and `period_end`');
      }

      if ( this.id ){
        var where = { id: this.id };

        if ( this.restaurant_id ){
          where.restaurant_id = this.restaurant_id;
        }

        return where;
      }

      return {
        restaurant_id:  this.restaurant_id
      , period_begin:   this.period_begin
      , period_end:     this.period_end
      };
    }

  , save: function( callback ){
      var onSave = function( error, result ){
        if ( error ){
          return callback( error );
        }

        pdfs.pms.build({ restaurant_id: result.restaurant_id, id: result.id }, function( error ){
          if ( error ){
            logger.warn('Error build PMS PDF', {
              error: error
            });
          }

          callback( error, result );
        }.bind( this ));
      }.bind( this );

      if ( this.id ){
        this.saveExisting( onSave );
      } else {
        this.saveNew( onSave );
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

  , remove: function( callback ){
      db.payment_summaries.remove( this.id, this, function( error, results ){
        if ( error ) return callback( error );

        return callback( null );
      }.bind( this ));
    }

  , isEmpty: function(){
      return !(this.orders && this.orders.length);
    }

  , parseResults: function( results ){
      results = results[0] || results;
      utils.extend( this, this.parseDbResult( results ) );
    }

  , parseDbResult: function( result ){
      if ( result ){
        result.orders = (result.orders || []).map( PMSItem.create );
        utils.extend( this, result );
      }

      return this;
    }

  , getOrdersQuery: function(){
      if ( !this.restaurant_id || !this.period_begin || !this.period_end ){
        throw new Error('Must provide restaurant_id, period_begin, and period_end to fetch orders');
      }

      var ordersQuery = {
        where: {
          status: 'accepted'
        , restaurant_id: this.restaurant_id
        , datetime: {
            $gte: { $custom: ['orders.datetime >= $1', this.period_begin] }
          , $lt:  { $custom: ['orders.datetime < ($1::timestamp + interval \'1 day\' )', this.period_end] }
          }
        }
      , order: { datetime: 'desc' }
      , many: []
      , one:  []
      };

      if ( Array.isArray( PMSItem.requiredOrderQueryOptions.many ) ){
        // Add in the required `many` fields, but omit `orders` since we're
        // doing some optimizations with a CTE
        var ordersMany = PMSItem.requiredOrderQueryOptions.many.filter( function( query ){
          return query.table !== 'orders';
        });

        ordersQuery.many = ordersQuery.many.concat( ordersMany );
      }

      for ( var key in PMSItem.requiredOrderQueryOptions ){
        if ( key === 'many' ) continue;

        ordersQuery[ key ] = PMSItem.requiredOrderQueryOptions[ key ];
      }

      return ordersQuery;
    }

  , getOrdersQueryOld: function(){
      var where = this.getFetchClause();

      var whereDatetime = {
        $gte: { $custom: ['orders.datetime >= payment_summaries.period_begin'] }
      , $lt:  { $custom: ['orders.datetime < (payment_summaries.period_end + interval \'1 day\' )'] }
      };

      // Since this is used outside the context `payment_summaries`
      // we need to specify the joined table `payment_summaries`
      for ( var key in where ){
        where[ mosql.quoteColumn( key, 'payment_summaries' ) ] = where[ key ];
        delete where[ key ];
      }

      var ordersQuery = {
        table: 'orders'
      , with: [
          { name: 'oi'
          , type: 'select'
          , table: 'order_items'
          , columns: ['order_items.*']
          , where: where
          , joins: [
              { type: 'left', target: 'orders', on: { id: '$order_items.order_id$' } }
            , { type: 'inner', target: 'payment_summaries', on: whereDatetime }
            ]
          }
        ]

      , joins: [
          { type: 'left', target: 'payment_summaries', on: this.getFetchClause() }
        ]

      , where: {
          status: 'accepted'
        , restaurant_id: {
            $custom: ['orders.restaurant_id = payment_summaries.restaurant_id']
          }
        , datetime: whereDatetime
        }

      , order: { datetime: 'desc' }

      , many: [
          { table: 'oi', alias: 'items', where: { 'orders.id': '$oi.order_id$' } }
        ]
      };

      if ( Array.isArray( PMSItem.requiredOrderQueryOptions.many ) ){
        // Add in the required `many` fields, but omit `orders` since we're
        // doing some optimizations with a CTE
        var ordersMany = PMSItem.requiredOrderQueryOptions.many.filter( function( query ){
          return query.table !== 'orders';
        });

        ordersQuery.many = ordersQuery.many.concat( ordersMany );
      }

      for ( var key in PMSItem.requiredOrderQueryOptions ){
        if ( key === 'many' ) continue;

        ordersQuery[ key ] = PMSItem.requiredOrderQueryOptions[ key ];
      }

      return ordersQuery;
    }

  , getQueryOptions: function(){
      var options = {
        one:  [ { table: 'restaurants'
                , alias: 'restaurant'
                }
              ]
      };

      return options;
    }
  });

module.exports.find = function( where, options, callback ){
  if ( typeof options === 'function' ){
    callback = options;
    options = {};
  }

  return db.payment_summaries.find( where, function( error, results ){
    if ( error ) return callback( error );

    results = results.map( function( pms ){
      return module.exports.create().parseDbResult( pms );
    });

    callback( null, results );
  });
};
