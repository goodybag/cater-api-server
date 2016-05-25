var db      = require('db');
var utils   = require('utils');
var Order   = require('../orders/base');

function getQueryOptions(){
  return {
    many: [ { table: 'user_invoice_orders'
            , one:    [ { table: 'latest_order_revisions'
                        , alias: 'latest_revision'
                        , where: { 'latest_order_revisions.order_id': '$user_invoice_orders.order_id$' }
                        }
                      ]
            , joins:  [ { type: 'left'
                        , target: 'orders'
                        , on: { id: '$user_invoice_orders.order_id$' }
                        }
                      ]
            , order:  ['orders.datetime desc']
            }
          ]

  , one:  [ { table: 'users'
            , alias: 'user'
            , one:  [ { table: 'addresses', alias: 'address'
                      , where: { is_default: true }
                      }
                    ]
            , many: [ { table: 'user_invoice_recipients', alias: 'invoice_recipients' } ]
            }
          ]
  }
}

module.exports = require('stampit')()
  .state({
    orders: []
  })
  .methods({
    fetch: function( callback ){
      var where = {
        billing_period_start: this.billing_period_start
      , billing_period_end:   this.billing_period_end
      , user_id:              this.user_id
      };

      if ( this.id ){
        where = { id: this.id };
      }

      var options = utils.extend( getQueryOptions(), {
        order: ['id desc']
      });

      db.user_invoices.findOne( where, options, function( error, result ){
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
      var tx = db.dirac.tx.create();

      tx.begin( function( error ){
        if ( error ){
          tx.rollback();
          return callback( error );
        }

        tx.user_invoices.insert( this, function( error, results ){
          if ( error ) return callback( error );

          this.parseResults( results );
          this.updateOrdersInvoiceId();
          this.saveOrders( tx, callback );
        }.bind( this ));
      }.bind( this ));
    }

  , saveExisting: function( callback ){
      var tx = db.dirac.tx.create();

      tx.begin( function( error ){
        if ( error ){
          tx.rollback();
          return callback( error );
        }

        tx.user_invoices.update( this.id, this, { returning: ['*'] }, function( error, results ){
          if ( error ) return callback( error );

          this.parseResults( results );
          this.updateOrdersInvoiceId();
          this.saveOrders( tx, callback );
        }.bind( this ));
      }.bind( this ));
    }

  , saveOrders: function( tx, callback ){
      var didNotPassTx = false;
      if ( typeof tx === 'function' ||  !tx ){
        callback = tx;
        tx = db.dirac.tx.create();
        didNotPassTx = true;
      }

      utils.async.series([
        didNotPassTx ? tx.begin.bind( tx ) : utils.async.noop

        // Remove existing orders on this invoice
      , tx.user_invoice_orders.remove.bind(
          tx.user_invoice_orders
        , { user_invoice_id: this.id }
        )

        // Insert user invoice orders
      , function( next ){
          // No orders to save
          if ( this.orders.length === 0 ){
            return next();
          }

          tx.user_invoice_orders.insert( this.orders, { returning: ['*'] }, function( error, results ){
            if ( error ) return next( error );

            this.orders = results;

            return next();
          }.bind( this ));
        }.bind( this )

        // Commit
      , tx.commit.bind( tx )
      ], function( error ){
        if ( error ){
          return tx.rollback( callback.bind( null, error ) );
        }

        callback( null, this );
      }.bind( this ));
    }

  , updateOrdersInvoiceId: function(){
      this.orders.forEach( function( order ){
        order.user_invoice_id = this.id;
      }.bind( this ));

      return this;
    }

  , parseResults: function( results ){
      results = results[0] || results;
      utils.extend( this, results );
    }

  , parseDbResult: function( result ){
      if ( result ){
        result.orders = result.user_invoice_orders.map( function( order ){
          ['user_invoice_id', 'order_id'].forEach( function( k ){
            order.latest_revision.data[ k ] = order[ k ];
          });

          Order.applyPriceHike(
            order.latest_revision.data
          , order.latest_revision.data.priority_account_price_hike_percentage
          );

          return order.latest_revision.data;
        });

        utils.extend( this, result );
      }

      return this;
    }
  });

module.exports.getQueryOptions = getQueryOptions;
