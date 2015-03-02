var db      = require('db');
var utils   = require('utils');
var Promise = require('bluebird');

module.exports = require('stampit')()
  .state({
    orders: []
  })
  .methods({
    fetch: function( callback ){
      if ( !this.id ){
        throw new Error('Cannot fetch without ID');
      }

      var options = {
        many: [{ table: 'user_invoice_orders', alias: 'orders' }]
      };

      db.user_invoices.findOne( this.id, options, function( error, result ){
        if ( error ) return callback( error );

        utils.extend( this, result );

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
      if ( typeof tx === 'function' ||  !tx ){
        callback = tx;
        tx = db.dirac.tx.create();
      }

      utils.async.series([
        // Remove existing orders on this invoice
        tx.user_invoice_orders.remove.bind(
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
          tx.rollback();
        }

        callback( error );
      });
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
  });