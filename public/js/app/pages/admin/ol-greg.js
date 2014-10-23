define(function(require){
  var $             = require('jquery-loaded');
  var Hbs           = require('handlebars');
  var async         = require('async');
  var utils         = require('utils');
  var PMSItem       = require('app/models/payment-summary-item');

  return Object.create({
    init: function( options ){
      this.options = options;

    }

  , generateSummary: function( rid, d1, d2, callback ){
      // Get orders for restaurant date range
      // Create new payment summary
      // for each order, create new pms item with order
      // save payment summary
    }
  });
});