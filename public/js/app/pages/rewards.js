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
      $( function(){
        this_.$cards          = $('.giftcard');
        this_.$headerPoints   = $('.navbar .points-wrapper');
        this_.$sidebarPoints  = $('.points-panel-available .points-available');

        this_.$cards.giftcard({ user: user });
        this_.$cards.on( 'redeem', function( $e, e ){
          this_.updatePoints( e.user.points + e.cost, e.user.points );
        });
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

      this.renderCards();
    }

  , renderCards: function(){
      $('.giftcards').html(
        hbs.partials.giftcards({
          user:   user
        , cards:  cards
        })
      );
    }
  });
});