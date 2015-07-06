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
      this.options = options;

      var this_ = this;

      this.$errors = this.$el.find('.errors');

      this.$address = this.$el.find('[name="address"]');

      gplaces( this.$address[0] );
    },

    onSubmit: function( e ){
      e.preventDefault();

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
          success: this.options.onSaveSuccess
        , error: this.displayErrors.bind( this, [{
            message: 'Something went wrong saving your address. Please try again'
          }])
        });
      }.bind( this ));
    }
  });
});