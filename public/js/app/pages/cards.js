define( function( require ){
  var $               = require('jquery');
  var user            = require('data/user');

  require('bootstrap');

  var Views = {
    AddPaymentMethod: require('app/views/add-payment-method')
  };

  var page = {
    init: function() {
      var addPaymentMethodView = new Views.AddPaymentMethod({
        el:       '.add-payment-method'
      , user:     user
      });
    }
  };

  return page;
});