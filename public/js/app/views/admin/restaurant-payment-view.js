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

  });

  module.exports = RestaurantPaymentView;
  return module.exports;
});
