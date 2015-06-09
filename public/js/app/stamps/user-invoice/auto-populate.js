var db        = require('db');
var utils     = require('utils');
var datetime  = require('stamps/datetime');

module.exports = require('stampit')()
  .compose( require('./db') )
  .methods({
    populateOrdersBasedOnDate: function( callback ){
      if ( typeof callback !== 'function' ){
        throw new Error('Must provide a callback');
      }

      if ( !this.user_id ){
        throw new Error('Invalid user');
      }

      if ( !this.billing_period_start || !this.billing_period_end ){
        throw new Error('Invalid billing period');
      }

      var $where = {
        status:     'accepted'
      , user_id:    this.user_id
      , datetime:   this.billing()
                      .getMosqlRangeQuery()
      , payment_method_id: { $null: true }
      };

      db.orders.find( $where, function( error, orders ){
        if ( error ) return callback( error );

        this.orders = orders;

        this.orders.forEach( function( order ){
          order.user_invoice_id = this.id;
          order.order_id = order.id;
        }.bind( this ));

        return callback( null, orders );
      }.bind( this ));
    }
  });