define(function(require){
  'use strict';

  var $       = require('jquery');
  var _       = require('lodash');
  var venter  = require('venter');
  var spinner = require('spinner');

  $.fn.giftcard = function( options ){
    var $this = this;

    if ( !options.user ){
      throw new Error('Missing required property: `user`');
    }

    if ( $this.length > 1 ){
      return $this.each( function(){
        $(this).giftcard( options );
      });
    }

    var defaults = {
      states: [
        'pre-click'
      , 'clicked-once'
      , 'success'
      , 'unavailable'
      , 'loading'
      , 'error'
      ]
    , defaultState: 'pre-click'
    , doubleClickTimeout: 2000
    , errorTimeout: 4000
    , successTimeout: 4000
    };

    options = $.extend( {}, defaults, options );

    var giftcard = {
      init: function(){
        giftcard.state = options.defaultState;

        if ( $this.hasClass('state-unavailable') ) giftcard.state = 'unavailable';

        giftcard.location = $this.data('location');
        giftcard.amount   = $this.data('amount');
        giftcard.cost     = $this.data('cost');

        $this.click( giftcard.onClick );

        return giftcard;
      }

    , redeem: function( callback ){
        giftcard.enterState('loading');
        spinner.start();

        $.ajax({
          type: 'POST'
        , url: [ '/api/users', options.user.id, 'rewards' ].join('/')
        , headers: {
            'Content-Type': 'application/json'
          }
        , data: JSON.stringify({
            location: giftcard.location
          , amount:   giftcard.amount
          , cost:     giftcard.cost
          })

        , success: function(){
            giftcard.enterState('success');
            spinner.stop();

            options.user.points -= giftcard.cost;

            setTimeout( function(){
              giftcard.enterState('pre-click');
            }, options.successTimeout );

            venter.trigger( 'user:points:change', {
              user:         options.user
            , cost:         giftcard.cost
            , location:     giftcard.location
            , amount:       giftcard.amount
            });

            $this.trigger( 'redeem', {
              user:         options.user
            , cost:         giftcard.cost
            , location:     giftcard.location
            , amount:       giftcard.amount
            });
          }

        , error: function(){
            giftcard.enterState('error');
            spinner.stop();

            setTimeout( function(){
              giftcard.enterState('pre-click');
            }, options.errorTimeout );
          }
        });

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
          $this.addClass('active');

          setTimeout( function(){
            if ( giftcard.state === 'clicked-once' ){
              giftcard.enterState('pre-click');
              $this.removeClass('active');
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