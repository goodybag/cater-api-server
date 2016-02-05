/**
 * Spinner
 *
 * spinner.spin( [target] )
 * If no target is passed in, it shows the main spinner
 * Otherwise, it attaches a spinner to the target and returns
 * that spinner instance
 *
 * spinner.stop()
 * Stop the main spinner
 *
 */

define(function(require, exports, module) {
  var $ = require('jquery');
  var Spinner = require('spin');
  'use strict';

  var options = {
    lines: 13 // The number of lines to draw
  , length: 20 // The length of each line
  , width: 10 // The line thickness
  , radius: 30 // The radius of the inner circle
  , corners: 1 // Corner roundness (0..1)
  , rotate: 0 // The rotation offset
  , direction: 1 // 1: clockwise, -1: counterclockwise
  , color: '#000' // #rgb or #rrggbb or array of colors
  , speed: 1 // Rounds per second
  , trail: 60 // Afterglow percentage
  , shadow: false // Whether to render a shadow
  , hwaccel: false // Whether to use hardware acceleration
  , className: 'spinner' // The CSS class to assign to the spinner
  , zIndex: 2e9 // The z-index (defaults to 2000000000)
  , top: 'auto' // Top position relative to parent in px
  , left: 'auto' // Left position relative to parent in px
  };

  var exports = {
    start: function( target ){
      if ( target ){
        return new Spinner().spin( target );
      }

      exports.$holder.css( 'display', 'block' );
    }

  , stop: function(){
      exports.$holder.css( 'display', 'none' );
    }
  };

  $(function(){
    exports.$holder = $('<div id="spinner-holder"></div>');

    exports.$holder.css({
      position: 'fixed'
    , top: 0
    , left: 0
    , width: '100%'
    , height: '100%'
    , background: "rgba(0, 0, 0, 0.1)"
    , display: 'none'
    , zIndex: 2e8
    });

    // Something stupid is happening somewhere
    setTimeout( function(){
      $( document.body ).append( exports.$holder );
    }, 1000 );

    exports.main = new Spinner( options ).spin( exports.$holder[0] );

    $( exports.main.el ).css({
      left: '50%'
    , top: '240px'
    });
  });

  return exports;
});