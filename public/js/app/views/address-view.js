define(function(require, exports, module) {
  var FormView = require('./form-view');
  var api = require('api');
  var gplaces = require('gplaces');

  return module.exports = FormView.extend({
    events: {
      'submit .address-edit': 'onSave',
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
    },

    fieldMap: {
      name:                     '.address-name'
    , street:                   '.address-street'
    , street2:                  '.address-street2'
    , city:                     '.address-city'
    , state:                    '.address-state'
    , zip:                      '.address-zip'
    , phone:                    '.address-phone'
    , delivery_instructions:    '.address-delivery-instructions'
    },

    fieldGetters: {
      phone: function() {
        return this.$el.find(this.fieldMap.phone).val().replace(/[^\d]/g, '') || null;
      },
      street2: function() {
        return this.$el.find(this.fieldMap.street2).val().trim();
      }
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

    onSave: function( e ){
      e.preventDefault();

      this.geocode( function( error, result ){
        if ( error ){
          return console.error( error );
        }

        return FormView.prototype.onSave.apply( this, arguments );
      }.bind( this ));
    }
  });
});