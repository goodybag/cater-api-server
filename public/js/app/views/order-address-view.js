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
      'click .save-address': 'onSaveAddressClick',
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

    saveAddress: function(callback) {
      var data = new FormView2({
        el: this.$el.find('.order-address.edit')
      }).getModelData();

      // Do not send blank values
      data = Object
        .keys( data )
        .reduce( function( obj, key ){
          if ( data[ key ] === '' ) return obj;
          obj[ key ] = data[ key ];
          return obj;
        }, {} );

      var saveAddress = function( done ){
        var sent = this.order.address.save( utils.clone( data ), {
          success: function(){
            return done();
          }

        , error: function( model, jqXHR, errorThrown ){
            var error = jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.error ?
              jqXHR.responseJSON.error : errorThrown;

            return done( error );
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
        delete orderData.id;
        delete orderData.name;

        var sent = this.order.save( orderData, {
          success: function(){
            return done();
          }

        , error: function( model, jqXHR, errorThrown ){
            var error = jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.error ?
              jqXHR.responseJSON.error : errorThrown;

            return done( error );
          }

        , patch: true
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
          this.options.orderView.model.trigger('change:invalid_address', error);

          if ( typeof callback === 'function' ){
            callback( error );
          }

          return;
        }

        this.render();

        if ( typeof callback === 'function' ){
          callback();
        }
      }.bind( this ));
    }

  , onCancelClick: function( e ){
      if ( this.previousModel ){
        this.order.address = this.previousModel;
        delete this.previousModel;
      }

      this.render();
    }

  , onSaveAddressClick: function( e ){
      this.saveAddress();
    }
  });
});