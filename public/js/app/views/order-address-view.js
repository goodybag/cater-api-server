define(function(require, exports, module) {
  var Address = require('app/models/address');
  var AddressView = require('./address-view');
  var Handlebars = require('handlebars');
  var states = require('states');
  var utils =require('utils');
  var FormView2 = require('app/views/form-view-2').extend({
    map: {
      address_name: 'name'
    }
  });

  var template = Handlebars.partials.order_delivery_info;

  return module.exports = AddressView.extend({
    events: {
      'click .toggle-edit': 'toggleEditAddress',
      'click .cancel-edit-btn': 'onCancelClick',
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
      this.previousModel = this.order.address;
      this.order.address = new Address();
      this.toggleEditAddress();
    },

    saveAddress: function(e) {
      var data = new FormView2({ el: this.$el }).getModelData();

      data = Object
        .keys( data )
        .reduce( function( obj, key ){
          if ( data[ key ] === '' ) return obj;
          obj[ key ] = data[ key ];
          return obj;
        }, {} );

      var sent = this.order.address.save( data, {
        success: function(){
          var sent = this.options.orderView.model.save(data, {
            success: _.bind(this.render, this),
            error: function(jqXHR, textstatus, errorThrown) {
              return this.options.orderView.model.trigger('change:invalid_address', textstatus, errorThrown);
            }.bind(this)
          });

          if (!sent) this.options.orderView.displayErrors();
        }.bind( this )

      , error: function( jqXHR, textstatus, errorThrown ){
          return this.options.orderView.model.trigger('change:invalid_address', textstatus, errorThrown);
        }.bind(this)
      });

      if (!sent) this.options.orderView.displayErrors();
    }

  , onCancelClick: function( e ){
      if ( this.previousModel ){
        this.order.address = this.previousModel;
        delete this.previousModel;
      }

      this.render();
    }
  });
});