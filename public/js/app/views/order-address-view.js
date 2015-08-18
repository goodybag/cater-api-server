define(function(require, exports, module) {
  var AddressView = require('./address-view');
  var Handlebars = require('handlebars');
  var states = require('states');
  var utils =require('utils');

  var template = Handlebars.partials.order_delivery_info;

  return module.exports = AddressView.extend({
    events: {
      'click .toggle-edit': 'toggleEditAddress',
      'click .cancel-edit-btn': 'render',
      'click .save-address': 'saveAddress',
      'click .add-address': 'addAddress'
    },

    template: template,

    initialize: function(options) {
      this.order = this.options.orderView.model;
    },

    render: function() {
      var order = this.order;
      var context = {
        user: this.options.user,
        order: order.toJSON(),
        states: states
      };
      context.orderAddress = function() {
        return {
          address:  utils.extend( order.address.toJSON(), {
                      name: context.order.address_name
                    }),
          states: context.states
        };
      };

      this.$el.html(this.template(context));
    },

    toggleEditAddress: function(e) {
      this.$el.find('.order-address').toggleClass('hide');
    },

    addAddress: function(e) {
      this.$el.find('input').val('');
      this.toggleEditAddress();
    },

    saveAddress: function(e) {
      var errors = this.options.orderView.validateAddress();
      if (errors) return this.options.orderView.displayErrors2(errors);

      var diff = this.getDiff(); // changes to address fields
      if (!diff) return this.render();

      if ( this.validationError ) return this.options.orderView.displayErrors();

      var original = utils.pick.apply(utils, [this.model.attributes].concat(Object.keys(diff)));

      var sent = this.options.orderView.model.save(diff, {
        success: _.bind(this.render, this),
        error: function(jqXHR, textstatus, errorThrown) {

          // revert to original state
          this.options.orderView.model.set(original);

          return this.options.orderView.model.trigger('change:invalid_address', textstatus, errorThrown);
        }.bind(this)
      })

      if (!sent)
        this.options.orderView.displayErrors();
    }
  });
});