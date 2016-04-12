define(function(require){
  var $ = require('jquery');
  var api = require('api');
  var utils = require('utils');;

  require('jquery-loaded');

  var Views = {
    EditBasicInfoView: require('app/views/restaurant/edit-billing-info-view')
  , AlertView: require('app/views/alert-view')
  , FormView: require('app/views/form-view-2')
  };

  var BankView = Views.FormView.extend({
    events: {
      'submit form': 'onBankAccountFormSubmit'
    }

  , save: function( data ){
      $.ajax({
        type: 'PUT'
      , url: '/api/restaurants/:id/bank-account'
              .replace( ':id', this.model.get('id') )
      , headers: { 'Content-Type': 'application/json' }
      , data: JSON.stringify( data )

      , success: this.trigger.bind( this, 'success' )

      , error: this.trigger.bind( this, 'error' )
      })
    }

  , onBankAccountFormSubmit: function( e ){
      e.preventDefault();

      var data = this.getModelData();

      data.metadata = {
        account_type: data.account_type
      , bank_name:    data.account_bank_name
      };

      delete data.account_type;
      delete data.account_bank_name;

      this.save( data );
    }
  });

  var LegalEntityView = Views.FormView.extend({
    typeGetters: {
      stripe_dob: function( $el ){
        var result = $el.find('input[type="date"]').val();

        if ( result === "" ){
          return null;
        }

        result = result.split('-');

        return {
          day: +result[2]
        , month: +result[1]
        , year: +result[0]
        };
      }
    }

  , events: {
      'submit form': 'onFormSubmit'
    }

  , initialize: function( options ){
      Views.FormView.prototype.initialize.call( this, options );

      if ( !options.api ){
        throw new Error('Must provide a restaurant api');
      }

      this.api = options.api;
    }

  , save: function( data ){
      this.api('legal-entity').patch( data, function( error, result ){
        if ( error ){
          if ( error.responseJSON ){
            error = error.responseJSON.error;
          }

          return this.trigger( 'error', error );
        }

        this.trigger( 'success', result );
      }.bind( this ));
    }

  , onFormSubmit: function( e ){
      e.preventDefault();

      var data = this.getModelData();

      this.save( data );
    }
  });

  var page = {
    init: function( options ){
      var alertView = new Views.AlertView({
        el: '.alert-container'
      });

      var restaurantApi = api.restaurants( options.models.restaurant.get('id') );

      options.models.restaurant.urlRoot = '/api/restaurants';

      var restaurantEditView = new Views.EditBasicInfoView({
        el : '#main-form'
      , model: options.models.restaurant
      , alertView: alertView
      });

      var editBankView = new BankView({
        el: '#bank-account'
      , model: options.models.restaurant
      });

      var entityAlertView = new Views.AlertView({
        el: '#stripe-legal-entity > .alerts'
      });

      var editLegalEntityView = new LegalEntityView({
        el: '#stripe-legal-entity'
      , api: restaurantApi
      });

      editBankView.on( 'success', function(){
        alertView.show({
          type: 'success'
        , message: 'Updated bank account successfully!'
        });

        window.scrollTo(0,0);
      });

      editBankView.on( 'error', function( error ){
        entityAlertView.show({
          type: 'danger'
        , message: 'Error saving bank account'
        });

        window.scrollTo(0,0);
      });

      editLegalEntityView.on( 'success', function( error ){
        var message = 'Stripe has been updated!';
        entityAlertView.show({ type: 'success', message: message });
        window.scrollTo( 0, entityAlertView.$el.offset().top );
      });

      editLegalEntityView.on( 'error', function( error ){
        var message = 'Error saving entity';

        if ( error.message ){
          message = error.message;
        }

        entityAlertView.show({ type: 'danger', message: message });
        window.scrollTo( 0, entityAlertView.$el.offset().top );
      });
    }
  };

  return page;
});
