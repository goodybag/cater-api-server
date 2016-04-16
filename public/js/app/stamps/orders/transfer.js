var OrderCharge = require('./charge');
var db = require('../../../../../db');
var utils = require('../../../../../utils');
var logger = require('../../../../../lib/logger').create('OrderTransfer');

module.exports = require('stampit')()
  .enclose( function(){
    if ( !this.order ){
      throw new Error('Must provide an order');
    }

    this.order = OrderCharge.create( this.order );
  })
  .methods({
    send: function( callback ){
      utils.stripe.transfers.create( this.getTransferData(), ( error, result )=>{
        if ( error ){
          this.error = error;
          return this.saveErrorToDatabase( error, ()=>{
            return callback( this.decorateErrorObject( error ) );
          });
        }

        this.transfer = result;

        return this.saveToDatabase( callback );
      });

      return this;
    }

  , reverse: function( callback ){
      if ( !this.transfer ){
        throw new Error('No existing transfer');
      }

      utils.stripe.transfers.createReversal( this.transfer.id, {}, ( error, result )=>{
        if ( error ){
          this.error = error;
          return callback( error );
        }

        this.transferReversal = result;

        return callback( null, this );
      });
    }

  , saveErrorToDatabase: function( error, callback ){
      db.invoiced_order_payment_transfers.insert( this.getErrorInsertData(), ( error, result )=>{
        // No big deal here if there was an error here. Either way, we'll re-try.
        return callback( null, this );
      });

      return this;
    }

  , saveToDatabase: function( callback ){
      db.invoiced_order_payment_transfers.insert( this.getInsertData(), ( error, result )=>{
        // Reverse the transfer if there was an error
        if ( error ){
          this.error = error;

          return this.reverse( ( reversalError )=>{
            // Jesus, I don't even know anymore
            if ( reversalError ){
              logger.error(
                'An error occurred while attempting a reversal.'
              , 'This is bad because this was an attempt to reconcile a previous error.'
              , 'The transfer has gone through, but we were not able to record it to the GB database.'
              , { error: error
                , reversalError: reversalError
                }
              );
            }

            callback( error );
          });
        }

        return callback( null, this );
      });

      return this;
    }

  , getTransferData: function(){
      var charge = OrderCharge.create( this.order );

      return {
        amount: this.order.getRestaurantCut()
      , currency: 'usd'
      , destination: this.order.restaurant.stripe_id
      , description: 'Order #' + this.order.id
      , statement_descriptor: 'GOODYBAG CATER #' + this.order.id
      , metadata: {
          user_id: this.order.user.id
        , restaurant_id: this.order.restaurant.id
        , order_id: this.order.id
        , order_uuid: this.order.uuid
        }
      };
    }

  , getErrorInsertData: function( error ){
      return {
        order_id: this.order.id
      , restaurant_id: this.order.restaurant.id
      , error: error
      };
    }

  , getInsertData: function(){
      return {
        order_id: this.order.id
      , restaurant_id: this.order.restaurant.id
      , stripe_transfer_id: this.transfer.id
      };
    }

  , decorateErrorObject: function( error ){
      error.order_id = this.order.id;
      error.restaurant_id = this.order.restaurant.id;
      return error;
    }
  })
