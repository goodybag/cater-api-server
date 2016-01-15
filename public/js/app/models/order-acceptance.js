if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var utils = require('utils');
  var api = require('api');

  var OrderAcceptance = utils.Model.extend({
    initialize: function(){
      this.state = {
        isSending: false
      , hasSent: false
      };
    }

  , isSending: function(){
      return this.state.isSending;
    }

  , hasSent: function(){
      return this.state.hasSent;
    }

  , send: function( callback ){
      if ( this.hasSent() || this.isSending() ){
        throw new Error('Cannot accept order twice');
      }

      callback = callback || utils.noop;

      var errors = this.validate();

      if ( errors && errors.length ){
        return callback( error );
      }

      this.state.isSending = true;

      this.trigger('loading');

      var data = {
        status: 'accepted'
      , review_token: this.get('review_token')
      };

      api.legacy.orders( this.get('order_id') )('status-history')
        .post( data, function( error, result ){
          this.trigger('loading-stop');
          this.state.isSending = false;

          if ( error ){
            this.trigger( 'error', error );
            return callback( error );
          }

          this.state.hasSent = true;

          this.trigger( 'save', result );

          return callback( null, result );
        }.bind( this ));
    }
  });

  OrderAcceptance.schema = {
    type: 'object',
    properties: {
      order_id: {
        type: ['integer']
      },
      review_token: {
        type: ['string'],
        required: true
      }
    }
  };

  return module.exports = OrderAcceptance;
});
