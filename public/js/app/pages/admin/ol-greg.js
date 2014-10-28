define(function(require){
  var $             = require('jquery-loaded');
  var Hbs           = require('handlebars');
  var async         = require('async');
  var utils         = require('utils');
  var PMSItem       = require('app/models/payment-summary-item');
  var Summaries     = require('app/collections/payment-summaries');
  var Orders        = require('app/collections/restaurant-orders');
  var Order         = require('app/models/order');
  var RangeSelector = require('app/views/admin/og-range-selector');

  return Object.create({
    init: function( options ){
      this.options = options;
      this.restaurants = utils.indexBy( options.restaurants, 'id' );

      utils.domready( this.domready.bind( this ) );
    }

  , domready: function(){
      this.rangeSelector = new RangeSelector().setElement('#range-processor');
      this.rangeSelector.on( 'submit', function( range ){
        this.runAllSummaries( range.from, range.to )
      }.bind( this ));
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

  , generateAllSummaries: function( d1, d2, options ){
      if ( typeof options === 'function' ){
        callback = options;
        options = null;
      }

      options = utils.defaults( options || {}, {
        onProgress: function( step, total, restaurant ){}
      , onError:    function( error, restaurant ){}
      , onComplete: function(){}
      });

      var MAX  = this.options.restaurants.length;
      var step = 0;

      var onRestaurant = function( restaurant, done ){
        this.generateSummary( restaurant.id, d1, d2, function( error ){
          options.onProgress( Math.min( ++step, MAX ), MAX, restaurant );

          if ( error ){
            options.onError( error, restaurant );
          }

          done();
        });
      }.bind( this );

      utils.async.eachSeries( this.options.restaurants, onRestaurant, function( error ){
        options.onComplete();
      });
    }
  });
});