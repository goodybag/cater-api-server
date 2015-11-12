define(function(require){
  var $ = require('jquery');
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

  var page = {
    init: function( options ){
      var alertView = new Views.AlertView({
        el: '.alert-container'
      });

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

      editBankView.on( 'success', alertView.show.bind( alertView, {
        type: 'success'
      , message: 'Updated bank account successfully!'
      }));

      editBankView.on( 'error', alertView.show.bind( alertView, {
        type: 'danger'
      , message: 'Error saving bank account'
      }));
    }
  };

  return page;
});