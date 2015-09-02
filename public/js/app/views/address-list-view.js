define(function(require, exports, module) {
  var FormView = require('./form-view');
  var AlertView = require('app/views/alert-view');

  return module.exports = FormView.extend({
    events: {
      'click .address-remove':      'removeAddress'
    , 'click .address-default':     'setDefaultAddress'
    , 'submit .address-edit':       'onSave'
    },

    initialize: function() {
      var this_ = this;

      this.alertView = new AlertView({
        el: this.$el.find('.alert-container')
      });

      // Cache elements
      this.$submitBtn = this.$el.find('.address-submit').button();

      this.on('save:success', function() {
        location.reload();
      });

      this.on('save:error', function( error ) {
        if ( error && error.responseJSON && error.responseJSON.error ){
          error = error.responseJSON.error;
        }

        if ( error && error.message ){
          this.alertView.show({
            type: 'danger'
          , message: error.message + '<br>Ensure to add suite/building numbers on Line 2'
          });

          window.scroll( 0, 0 );
        }

        this.$submitBtn.button('error');
        setTimeout(function() { this_.$submitBtn.button('reset'); }, 2000);
      }.bind( this ));
    },

    fieldMap: {
      name:                     '.address-edit .address-name'
    , street:                   '.address-edit .address-street'
    , street2:                  '.address-edit .address-street2'
    , city:                     '.address-edit .address-city'
    , state:                    '.address-edit .address-state'
    , zip:                      '.address-edit .address-zip'
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
    }
  });
});