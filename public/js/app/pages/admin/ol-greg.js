define(function(require){
  var $             = require('jquery-loaded');
  var Hbs           = require('handlebars');
  var async         = require('async');
  var utils         = require('utils');
  var PMSItem       = require('app/models/payment-summary-item');
  var Summaries     = require('app/collections/payment-summaries');
  var Orders        = require('app/collections/orders');
  var Order         = require('app/models/order');


  return Object.create({
    init: function( options ){
      this.options = options;

    }

  , generateSummary: function( rid, d1, d2, callback ){
      var orders = new Orders( null, { restaurant_id: rid } );
      var summaries = new Summaries( null, {
        restaurant_id: options.restaurant.id
      });

      var fetchOrdersAndSaveNewSummary = utils.async.parallel.bind( utils.async, {
        orders: function( done ){
          orders.fetch({
            start_date: d1
          , end_date:   d2
          , limit:      'all'
          , status:     'accepted'
          , success:    function(){ done( null, orders ); }
          , error:      done
          })
        }

      , summary: function( done ){
          var summary = summaries.createModel();
          summary.save( null, {
            success: function(){ done( null, summary ); }
          , error:   done
          });
        }
      });

      // Create new payment summary
      // for each order, create new pms item with order
      // save payment summary
    }
  });
});