define(function(require, exports, module) {
  var FormView2 = require('./form-view-2');
  var api = require('api');
  var gplaces = require('gplaces');

  return module.exports = FormView2.extend({
    events: {
      'submit .address-edit': 'onSubmit',
    },

    twoways: {
      name: true
    , street2: true
    , phone: true
    , delivery_instructions: true
    }

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

        this.model.set( result.address );

        return callback( null, result );
      }.bind( this ));
    },

    onSubmit: function( e ){
      e.preventDefault();

      var data = this.getModelData();
      var errors = this.model.validate( data );

      this.geocode( function( error, result ){
        if ( error ){
          return console.error( error );
        }

        
      }.bind( this ));
    }
  });
});