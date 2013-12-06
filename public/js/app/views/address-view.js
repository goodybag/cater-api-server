define(function(require, exports, module) {
  var FormView = require('form-view');

  module.exports = FormView.extend({
    events: {
      'submit .address-edit': 'onSave'
    },

    initialize: function() {
      var this_ = this;

      // Cache elements
      this.$submitBtn = this.$el.find('.address-submit').button();

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
    }
  });
});