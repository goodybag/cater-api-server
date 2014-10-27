define(function(require){
  var $             = require('jquery-loaded');
  var Hbs           = require('handlebars');
  var async         = require('async');
  var utils         = require('utils');
  var PMSItem       = require('app/models/payment-summary-item');
  var Summaries     = require('app/collections/payment-summaries');
  var Orders        = require('app/collections/restaurant-orders');
  var Order         = require('app/models/order');


  return Object.create({
    init: function( options ){
      this.options = options;
      this.restaurants = utils.indexBy( options.restaurants, 'id' );
    }

  , generateSummary: function( rid, d1, d2, callback ){
      var summary = new Summaries( null, {
        sales_tax:      this.restaurants[ rid ].region.sales_tax
      , restaurant_id:  rid
      }).createModel();

      summary.generate( d1, d2, function( error ){
        if ( error ) return callback( error );

        summary.save( null, {
          error: callback
        , success: function(){ if ( callback ) callback( null, summary ); }
        });
      });

      return summary;
    }
  });
});