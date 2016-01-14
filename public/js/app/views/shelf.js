define(function(require, exports, module) {
  var utils = require('utils');
  var $ = require('jquery');

  return module.exports = utils.View.extend({
    events: {
      'click [data-role="close"]': 'onCloseClick'
    }

  , initialize: function( options ){
      this.options = utils.defaults( options || {}, {
        // Elements to ignore when checking `clicked outside` events
        exclusions: []
      });

      this.onBodyClick = this.onBodyClick.bind( this );
    }

  , startListening: function(){
      $( document.body ).click( this.onBodyClick );
    }

  , stopListening: function(){
      $( document.body ).off( this.onBodyClick );
    }

  , toggle: function(){
      this.$el.toggleClass('in');
      return this;
    }

  , open: function(){
      console.log('open');
      this.$el.addClass('in');
      return this;
    }

  , close: function(){
      console.log('close');
      this.$el.removeClass('in');
      return this;
    }

  , isOpen: function(){
      return this.$el.hasClass('in');
    }

  , elementInExclusions: function( elA ){
      return this.options.exclusions.some( function( elB ){
        return elA === elB;
      });
    }

  , onCloseClick: function( e ){
      this.close();
    }

  , onBodyClick: function( e ){
      if ( !this.isOpen() ){
        return;
      }

      var current = e.target;

      while ( current !== document.body ){
        if ( current === this.$el[0] ) return;
        if ( this.elementInExclusions( current ) ) return;

        current = current.parentElement;
      }

      this.close();
    }
  });
});