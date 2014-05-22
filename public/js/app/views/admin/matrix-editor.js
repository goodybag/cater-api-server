/**
 * Tree Editor
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var $         = require('jquery-loaded');
  var Hbs       = require('handlebars');
  var utils     = require('utils');
  var config    = require('config');
  var spinner   = require('spinner');

  return module.exports = utils.View.extend({
    events: {
      'mouseenter td:first-child ~ td': 'onTdMouseEnter'
    , 'mouseleave td:first-child ~ td': 'onTdMouseLeave'
    , 'mouseenter th':                  'onTdMouseEnter'
    , 'mouseleave th':                  'onTdMouseLeave'
    }

  , template: Hbs.partials['matrix_editor']

  , initialize: function( options ){
      utils.enforceRequired( options, [
        'set', 'values'
      ]);

      utils.defaults( options, {

      });

      this.set    = options.set.sort();
      this.values = options.values;

      return this;
    }

  , render: function(){
      this.$el.html( this.template({
        set:      this.set
      , values:   this.values
      }));

      this.$trs = this.$el.find('tr');

      return this
    }

  , highlightTdColumn: function( $el ){
      if ( !($el instanceof jQuery) ) $el = $( $el );

      this.$focus = $el.addClass('focus');
      var col = $el.prevAll().length + 1;

      this.$highlighted = this.$trs.find(':nth-child(' + col + ')').addClass('highlight');
    }

  , unhighlightTdColumn: function(){
      if ( this.$focus && this.$highlighted ){
        this.$focus.removeClass('focus');
        this.$highlighted.removeClass('highlight');
        delete this.$focus;
        delete this.$highlighted;
      }
    }

  , onTdMouseEnter: function( e ){
      this.highlightTdColumn( e.currentTarget );
    }

  , onTdMouseLeave: function( e ){
      this.unhighlightTdColumn();
    }
  });
});