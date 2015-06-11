define(function(require, exports, module) {
  var FormView = require('./form-view');
  var api = require('api');
  var gplaces = require('gplaces');

  return module.exports = FormView.extend({
    events: {
      'click .address-remove':      'removeAddress'
    , 'click .address-default':     'setDefaultAddress'
    , 'submit .address-edit':       'onSave'
    },

    initialize: function() {
      var this_ = this;

      // Cache elements
      this.$address = this.$el.find('[name="address"]');
      this.$submitBtn = this.$el.find('.address-submit').button();

      gplaces( this.$address[0] );

      this.on('save:success', function() {
        location.reload();
      });

      this.on('save:error', function() {
        this.$submitBtn.button('error');
        setTimeout(function() { this_.$submitBtn.button('reset'); }, 2000);
      });
    },

    fieldMap: {
      name:                     '.address-edit .address-name'
    // , street:                   '.address-edit .address-street'
    , street2:                  '.address-edit .address-street2'
    // , city:                     '.address-edit .address-city'
    // , state:                    '.address-edit .address-state'
    // , zip:                      '.address-edit .address-zip'
    , phone:                    '.address-edit .address-phone'
    , delivery_instructions:    '.address-edit .address-delivery-instructions'
    },

    fieldGetters: {
      phone: function() {
        return this.$el.find(this.fieldMap.phone).val().replace(/[^\d]/g, '') || null;
      }
    },

    removeAddress: function(e) {
      var id = $(e.target).data('id');
      var address = this.collection.get(id);
      address.destroy({
        success: function(model, response) {
          location.reload();
        },
        error: function(model, xhr, options) {
          console.error('Unable to remove address');
        }
      });
    },

    setDefaultAddress: function(e) {
      var id = $(e.target).data('id');
      var address = this.collection.get(id);
      address.save({is_default: true}, {
        success: function(model, response, options) {
          location.reload();
        },
        error: function(model, xhr, options) {
          console.error('Unable to set a default address');
        }
      });
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