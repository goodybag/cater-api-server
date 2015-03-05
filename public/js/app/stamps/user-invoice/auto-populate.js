var db    = require('db');
var utils = require('utils');

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
      , datetime: {
          $gte: this.billing_period_start
        , $lt:  this.billing_period_end
        }
      , payment_method_id: { $null: true }
      };

      db.orders.find( $where, function( error, orders ){
        if ( error ) return callback( error );

        this.orders = orders;

        this.orders.forEach( function( order ){
          order.user_invoice.id = this.id;
          order.order_id = order.id;
        }.bind( this ));

        return callback( null, orders );
      }.bind( this ));
    }
  });