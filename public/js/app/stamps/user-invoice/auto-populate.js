var utils = require('utils');

module.exports = require('stampit')()
  .compose( require('./db') )
  .methods({
    populateOrdersBasedOnDate: function( callback ){
      if ( typeof callback !== 'function' ){
        throw new Error('Must provide a callback');
      }

      if ( !this.id ){
        throw new Error('Mising id, must be saved first');
      }

      if ( !this.user_id ){
        throw new Error('Invalid user');
      }

      if ( !this.billing_period_start || this.billing_period_end ){
        throw new Error('Invalid billing period');
      }

      var $where = {
        status:     'accepted'
      , user_id:    this.user_id
      , datetime: {
          $gte: this.billing_period_start
        , $lt:  this.billing_period_end
        }
      };

      db.orders.find( $where, function( error, orders ){
        if ( error ) return callback( error );

        var uios = orders.map( function( order ){
          return { user_invoice_id: this.id, order_id: order.id };
        }.bind( this ));

        db.user_invoice_orders.insert( uios, function( error, results ){
          if ( error ) return callback( error );

          var orderIndex = utils.indexBy( orders, 'id' );
          this.orders = results;

          this.orders.forEach( function( order ){
            utils.extend( order, orderIndex[ order.id ] );
          });

          return callback();
        }.bind( this ));
      }.bind( this ));
    }
  });