define(function(require, exports, module) {
  var FormView2 = require('./form-view-2');
  var api = require('api');
  var gplaces = require('gplaces');
  var utils = require('utils');
  var AddressForm = require('app/models/address-form');

  return module.exports = FormView2.extend({
    events: {
      'submit .address-edit': 'onSubmit',
    },

    Model: AddressForm,

    initialize: function( options ) {
      var this_ = this;

      this.$errors = this.$el.find('.errors');

      this.$address = this.$el.find('[name="address"]');

      gplaces( this.$address[0] );
    },

    saveData: function( callback ){
      var data = this.getModelData();
      var errors = this.model.validate( this.model.toJSON() );

      this.clearErrors();

      if ( errors ){
        return this.displayErrors( errors );
      }

      this.model.set( data );

      this.model.geocode( function( error, address ){
        if ( error ){
          return this.displayErrors([ error ]);
        }

        address.save( null, {
          success: function(){
            this.emit( 'save:success', address );
            if ( callback ) callback( null, address );
          }
        , error: function( error ){
            if ( callback ){
              return callback( error );
            }

            this.displayErrors([{
              message: 'Something went wrong saving your address. Please try again'
            }]);

            this.emit( 'save:error', error );
          }.bind( this )
        });
      }.bind( this ));
    },

    onSubmit: function( e ){
      e.preventDefault();
      this.saveData();
    }
  });
});