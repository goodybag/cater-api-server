define(function(require){
  'use strict';

  var $ = require('jquery');
  var _ = require('lodash');

  $.fn.giftcard = function( options ){
    var $this = this;

    if ( $this.length > 1 ){
      return $this.each( function(){
        $(this).giftcard( options );
      });
    }

    var defaults = {
      states: [
        'pre-click'
      , 'clicked-once'
      , 'clicked-twice'
      , 'unavailable'
      , 'loading'
      ]
    , defaultState: 'pre-click'
    , doubleClickTimeout: 2000
    };

    options = $.extend( {}, defaults, options );

    var giftcard = {
      init: function(){
        giftcard.state = options.defaultState;

        giftcard.location = $this.data('location');
        giftcard.amount   = $this.data('amount');
        giftcard.cost     = $this.data('cost');

        $this.click( giftcard.onClick );

        return giftcard;
      }

    , redeem: function( callback ){
        giftcard.enterState('loading');
        return giftcard;
      }

    , enterState: function( state ){
        if ( options.states.indexOf( state ) === - 1){
          throw new Error( 'Invalid state: ' + state );
        }

        console.log("Entering state:", state);

        giftcard.removeState();
        giftcard.state = state;
        $this.addClass( 'state-' + state );

        return giftcard;
      }

    , removeState: function(){
        _.each( options.states, function( state ){
          $this.removeClass( 'state-' + state );
        });

        delete giftcard.state;

        return giftcard;
      }

    , onClick: function( e ){
        if ( giftcard.state === 'pre-click' ){
          setTimeout( function(){
            if ( giftcard.state === 'clicked-once' ){
              giftcard.enterState('pre-click');
            }
          }, options.doubleClickTimeout );

          return giftcard.enterState('clicked-once');
        }

        if ( giftcard.state === 'clicked-once' ){
          return giftcard.redeem();
        }
      }
    };

    return giftcard.init();
  };
});