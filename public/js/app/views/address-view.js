define(function(require, exports, module) {
  var FormView2 = require('./form-view-2');
  var api = require('api');
  var gplaces = require('gplaces');
  var utils = require('utils');
  var Address = require('app/models/address');
  var AddressForm = require('app/models/address-form');

  return module.exports = FormView2.extend({
    events: {
      'submit .address-edit': 'onSubmit',
    },

    Model: AddressForm,

    initialize: function() {
      var this_ = this;

      this.$errors = this.$el.find('.errors');

      // Cache elements
      this.$address = this.$el.find('[name="address"]');
      this.$submitBtn = this.$el.find('.address-submit').button();

      gplaces( this.$address[0] );

      this.on('save:success', function() {
        this_.$submitBtn.button('success');
        setTimeout(function() { this_.$submitBtn.button('reset'); }, 2000);
      });

      this.on('save:error', function() {
        this_.$submitBtn.button('error');
        setTimeout(function() { this_.$submitBtn.button('reset'); }, 2000);
      });
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
          console.error( error );
          return this.displayErrors([ error ]);
        }

      address.save( null, {
          success: function(){
            console.log('success');
          }
        , error: console.error.bind( console )
        });

        console.log( address.validationError );
      }.bind( this ));
    }
  });
});