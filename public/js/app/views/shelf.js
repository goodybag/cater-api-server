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
      if ( this.isOpen() ){
        this.close();
      } else {
        this.open();
      }

      return this;
    }

  , open: function(){
      this.$el.addClass('in');
      this.trigger('open');
      return this;
    }

  , close: function(){
      this.$el.removeClass('in');
      this.trigger('close');
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