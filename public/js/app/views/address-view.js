define(function(require, exports, module) {
  var FormView2 = require('./form-view-2');
  var api = require('api');
  var gplaces = require('gplaces');
  var Address = require('app/models/address');

  return module.exports = FormView2.extend({
    events: {
      'submit .address-edit': 'onSubmit',
    },

    twoways: {
      name: true
    , street2: true
    , phone: true
    , delivery_instructions: true
    },

    initialize: function() {
      var this_ = this;

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

      this.initTwoWays();
    },

    geocode: function( callback ){
      api.maps.geocode( this.$address.val(), function( error, result ){
        if ( error ){
          return callback( error );
        }

        this.model.set( utils.omit( result.address, 'street2' ) );

        return callback( null, result );
      }.bind( this ));
    },

    displayErrors: function( errors ){
      return FormView2.prototype.displayErrors.call(
        this, errors, this.$el.find('.errors'), Address
      );
    },

    onSubmit: function( e ){
      e.preventDefault();

      this.geocode( function( error, result ){
        if ( error ){
          return console.error( error );
        }

        if ( !result.valid ){
          return this.displayErrors([{
            property: 'address'
          , validatorName: 'pattern'
          }]);
        }

        // Geocode will use null, but api currently expects ''
        if ( this.model.get('street2') === null ){
          this.model.set('street2', '');
        }

        if ( this.model.get('delivery_instructions') === null ){
          this.model.set('delivery_instructions', '');
        }

        var errors = this.model.validate( this.model.toJSON() );

        if ( errors ){
          return this.displayErrors( errors );
        }

        this.model.save()
          .error( console.error.bind( console ) )
          .then( function(){
            console.log('success');
          })
      }.bind( this ));
    }
  });
});