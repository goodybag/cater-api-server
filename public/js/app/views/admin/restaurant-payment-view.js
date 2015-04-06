/**
 * Admin Panel - Create a payment to a restaurant
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var $         = require('jquery-loaded');
  var Hbs       = require('handlebars');
  var utils     = require('utils');
  var spinner   = require('spinner');

  var RestaurantPaymentView = utils.View.extend({
    events: function() {
        var events = {};
        events['submit ' + this.options.form] = 'onFormSubmit';
        return events;
    },

    initialize: function(){
      this.options.$form = this.options.$form || this.$el.find(this.options.form);
      this.options.$list = this.options.$list || this.$el.find(this.options.list);
    },

    onFormSubmit: function(e){
      e.preventDefault();
      this.submit();
    },

    submit: function() {
      var data = {
        amount: Hbs.helpers.pennies(this.options.$form.find('.input-amount').val())
      , restaurant_id: this.options.restaurant.id
      };

      spinner.start();

      $.ajax({
        url: '/api/restaurants/' + this.options.restaurant.id + '/payments'
      , method: 'POST'
      , data: data
      })
      .done(this.addRow.bind(this))
      .fail(this.error.bind(this))
      .always(spinner.stop);
    },

    addRow: function(payment) {
      var html = Hbs.partials.restaurant_payment_row(payment);
      this.options.$list.prepend(html);
    },

    error: function() {
      this.options.alertView.show({ type: 'error', message: 'Unable to make payment - Ask tech for assistance before trying again!' });
    }
  });

  module.exports = RestaurantPaymentView;
  return module.exports;
});
