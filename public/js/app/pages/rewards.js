define(function(require){
  var $       = require('jquery-loaded');
  var user    = require('data/user');
  var cards   = require('data/cards');
  var helpers = require('hb-helpers');
  var hbs     = require('handlebars');

  require('giftcard');

  return Object.create({
    init: function(){
      var this_ = this;

      this.giftcardViewOptions = {
        user: user
      , successTimeout: 4000
      };

      $( function(){
        this_.$headerPoints   = $('.navbar .points-wrapper');
        this_.$sidebarPoints  = $('.points-panel-available .points-available');
        this_.initCards();
      });

      analytics.page('User Rewards');
    }

  , initCards: function(){
      var this_ = this;

      this.$cards = $('.giftcard');
      this.$cards.giftcard( this.giftcardViewOptions );
      this_.$cards.on( 'redeem', function( $e, e ){
        this_.updatePoints( e.user.points + e.cost, e.user.points );

        setTimeout(
          this_.renderCards.bind( this_ )
        , this_.giftcardViewOptions.successTimeout
        );
      });
    }

    // Animates points on page from `from` to `to`
  , updatePoints: function( from, to ){
      var this_ = this;

      $({ points: from }).animate({ points: to }, {
        duration: 1000
      , step: function(){
          var val = helpers.commatize( parseInt( this.points ) );

          this_.$headerPoints.text( val );
          this_.$sidebarPoints.text( val );
        }
      });

      // Sometimes animate doesn't end on the right number :/
      setTimeout( function(){
        this_.$headerPoints.text( to );
        this_.$sidebarPoints.text( to );
      }, 1000 );
    }

  , renderCards: function(){
      $('.giftcards').html(
        hbs.partials.giftcards({
          user:   user
        , cards:  cards
        })
      );

      this.initCards();
    }
  });
});
