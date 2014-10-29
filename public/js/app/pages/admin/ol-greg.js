define(function(require){
  var $             = require('jquery-loaded');
  var Hbs           = require('handlebars');
  var async         = require('async');
  var config        = require('config');
  var utils         = require('utils');
  var PMSItem       = require('app/models/payment-summary-item');
  var Summaries     = require('app/collections/payment-summaries');
  var Orders        = require('app/collections/restaurant-orders');
  var Order         = require('app/models/order');
  var RangeSelector = require('app/views/admin/og-range-selector');
  var SummaryTRView = require('app/views/admin/og-summary-tr-view');
  var progress      = require('progress-indicator');

  return Object.create({
    init: function( options ){
      this.options = options;
      this.restaurants = utils.indexBy( options.restaurants, 'id' );

      utils.domready( this.domready.bind( this ) );
    }

  , domready: function(){
      this.rangeSelector = new RangeSelector().setElement('#range-processor');
      this.rangeSelector.on( 'submit', function( range ){
        this.run( range.from, range.to );
      }.bind( this ));

      this.$restaurantsById = {};
      this.options.restaurants.forEach( function( r ){
        var summaryView = new SummaryTRView().setElement('[data-rid="' + r.id + '"]');
        this.$restaurantsById[ r.id ] = summaryView;
      }.bind( this ));

      this.pindicator = progress( $('.progress-indicator')[0] );

      $('#results [data-role="create"]').click( function( e ){
        if ( !this.rangeSelector.validate() ) return;

        var rid         = $(e.currentTarget).parents('[data-rid]').data('rid');
        var $restaurant = this.$restaurantsById[ rid ];
        var range       = this.rangeSelector.getValues();

        $restaurant.setStatus('working');

        this.generateSummary( rid, range.from, range.to, function( error, summary ){
          if ( error ){
            $restaurant.setStatus('error');
            return;
          }

          $restaurant.setSummary( summary );
          $restaurant.setStatus('complete');
        }.bind( this ));
      }.bind( this ));
    }

  , run: function( d1, d2 ){
      $('.progress-indicator').removeClass('hide');
      for ( var id in this.$restaurantsById ){
        this.$restaurantsById[ id ].setStatus('waiting');
      }

      this.generateAllSummaries( d1, d2, {
        onRestaurant: function( restaurant ){
          this.$restaurantsById[ restaurant.id ].setStatus('working');
        }

      , onProgress: function( step, total, restaurant, summary ){
          this.pindicator.set( (step / total) * 100 );
          this.$restaurantsById[ restaurant.id ].setSummary( summary );
          this.$restaurantsById[ restaurant.id ].setStatus('complete');
        }.bind( this )

      , onError: function( error, restaurant ){
          this.$restaurantsById[ restaurant.id ].setStatus('error');
        }.bind( this )

      , onComplete: function(){
          $('.progress-indicator').addClass('hide');
        }.bind( this )
      });
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
      , delay:      3000
      });

      var MAX  = this.options.restaurants.length;
      var step = 0;

      var onRestaurant = function( restaurant, done ){
        this.generateSummary( restaurant.id, d1, d2, function( error, summary ){
          options.onProgress( Math.min( ++step, MAX ), MAX, restaurant, summary );

          if ( error ){
            options.onError( error, restaurant );
          }

          setTimeout( done, options.delay );
        });
      }.bind( this );

      utils.async.eachSeries( this.options.restaurants, onRestaurant, function( error ){
        options.onComplete();
      });
    }
  });
});