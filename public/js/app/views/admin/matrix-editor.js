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
    , 'mouseenter th:first-child ~ th': 'onTdMouseEnter'
    , 'mouseleave th:first-child ~ th': 'onTdMouseLeave'
    , 'click tr > td:first-child':      'onFirstTdClick'
    , 'keyup      td':                  'onTdKeyup'
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

      this.rowEdits = {};

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

  , setRowToMultiEdit: function( $tr ){
      if ( this.rowEdits[ $tr.data('index') ] ){
        return this;
      }

      this.rowEdits[ $tr.data('index') ] = true;
      $tr.addClass('multi-edit');

      return this;
    }

  , unsetRowToMultiEdit: function( $tr ){
      if ( !this.rowEdits[ $tr.data('index') ] ){
        return this;
      }

      delete this.rowEdits[ $tr.data('index') ];
      $tr.removeClass('multi-edit');

      return this;
    }

  , toggleRowEdit: function( $tr ){
      if ( this.rowEdits[ $tr.data('index') ] ){
        return this.unsetRowToMultiEdit( $tr );
      } else {
        return this.setRowToMultiEdit( $tr );
      }
    }

  , updateMultiEdits: function( val ){
      var this_ = this;

      this.$trs.filter( function(){
        return $(this).data('index') in this_.rowEdits;
      }).find('> td:first-child ~ td').text( val );

      return this;
    }

  , onTdMouseEnter: function( e ){
      this.highlightTdColumn( $( e.currentTarget ) );
    }

  , onTdMouseLeave: function( e ){
      this.unhighlightTdColumn();
    }

  , onFirstTdClick: function( e ){
      this.toggleRowEdit( $( e.currentTarget ).closest('tr') );
    }

  , onTdKeyup: function( e ){
      this.updateMultiEdits( $( e.currentTarget ).text() );
    }
  });
});