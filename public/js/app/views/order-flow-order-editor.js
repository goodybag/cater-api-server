define( function( require ){
  var gplaces = require('gplaces');
  var config = require('config');
  var utils = require('utils');
  var api = require('api');
  var FormView = require('app/views/form-view-2');
  var orderParamsDatetimeMixin = require('app/views/mixins/order-params-datetime');

  var schema = {
    type: 'object'
  , properties: {
      address: { type: ['string'], required: true }
    , datetime: { type: ['string'], required: true }
    , guests: { type: ['number'], required: true }
    }
  };

  var View = FormView.extend({
    typeGetters: {
      datetime: function( $el ){
        var $date = $el.find('[role="date"]');
        var $time = $el.find('[role="time"]');

        return $date.val() + ' ' + $time.val();
      }
    }

  , events: {
      'submit form': 'onSubmit'
    }

  , initialize: function( options ){
      FormView.prototype.initialize.call( this, options );
      gplaces( this.$el.find('[name="address"]')[0] );
      this.initDateTimePicker();
    }

  , onSubmit: function( e ){
      e.preventDefault();

      var data = this.getModelData();

      Object.keys( schema.properties ).forEach( function( key ){
        if ( typeof data[ key] !== 'string' ) return;
        if ( data[ key ].replace( /\s/g, '' ) === '' ){
          delete data[ key ];
        }
      });

      if ( data.guests === 0 ){
        delete data.guests;
      }

      var errors;
      var options = { singleError: false, enforceRequired: true };

      utils.validator.validate( data, schema, options, function( _errors ){
        errors = _errors;
      });

      if ( errors ){
        return this.displayErrors( errors, this.$el.find('.errors') );
      }

      var method = api.orders.post;

      if ( this.options.order_id ){
        method = api.orders( this.options.order_id ).put;
      } else if ( this.options.user_id ){
        data.user_id = this.options.user_id;
      }

      if ( this.options.clearRestaurant ){
        data.restaurant_id = null;
      }

      method( data, function( error, result ){
        if ( error ){
          this.trigger( 'error', error );
          return console.error( error );
        }

        this.trigger( 'save', result );
      }.bind( this ));
    }
  });

  utils.extend( View.prototype, orderParamsDatetimeMixin({
    dateSelector:   '[role="date"]'
  , timeSelector:   '[role="time"]'
  }));

  return View;
});
