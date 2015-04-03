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
      var amt = this.options.$form.find('.input-amount').val();
      var data = {
        amount: Hbs.helpers.pennies(amt)
      };

      $.ajax({
        url: '/api/restaurants/' + this.options.restaurant.id + '/payments'
      , method: 'POST'
      , data: data
      });

    }

  });

  module.exports = RestaurantPaymentView;
  return module.exports;
});
