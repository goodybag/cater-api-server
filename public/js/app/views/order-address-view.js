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

      // Do not send blank values
      data = Object
        .keys( data )
        .reduce( function( obj, key ){
          if ( data[ key ] === '' ) return obj;
          obj[ key ] = data[ key ];
          return obj;
        }, {} );

      var saveAddress = function( done ){
        var sent = this.order.address.save( data, {
          success: function(){
            return done();
          }

        , error: function( jqXHR, textstatus, errorThrown ){
            return done( errorThrown );
          }
        });

        if ( !sent ){
          this.order.validationError = this.order.address.validationError;
          return this.options.orderView.displayErrors();
        }
      }.bind( this );

      var saveOrder = function( done ){
        var orderData = utils.clone( data );
        orderData.address_name = orderData.name;
        delete orderData.name;

        var sent = this.order.save( data, {
          success: function(){
            return done();
          }

        , error: function( jqXHR, textstatus, errorThrown ){
            return done( errorThrown );
          }
        });

        if (!sent) this.options.orderView.displayErrors();
      }.bind( this );

      utils.async.series([
        // This state is the worst, but since we do not (for some reason)
        // track user_address_id on the orders, we cannot reliably figure out
        // which address object to save, unless we're adding a new one.
        // If they clicked `edit`, ONLY save the order
        this.previousModel ? saveAddress : function( done ){ return done(); }
      , saveOrder
      ], function( error ){
        if ( error ){
          return this.options.orderView.model.trigger('change:invalid_address', error);
        }

        this.render();
      }.bind( this ));
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