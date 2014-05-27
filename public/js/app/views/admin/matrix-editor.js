/**
 * Matrix Editor
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

  , allowedChars: '01234567890.'

  , template: Hbs.partials['matrix_editor']

  , initialize: function( options ){
      utils.enforceRequired( options, [
        'set'
      ]);

      utils.defaults( options, {

      });

      this.setSet( options.set );

      this.rowEdits = {};

      return this;
    }

  , setSet: function( set ){
      this.set = set.sort();

      this.values = this.values || {};

      // Initialize at 0
      var i, ii, l;
      for ( i = 0, l = this.set.length; i < l; ++i ){
        if ( !this.values[ this.set[i] ] ){
          this.values[ this.set[i] ] = {};
        }
        for ( ii = 0; ii < l; ++ii ){
          if ( !this.values[ this.set[i] ][ this.set[ii] ] ){
            this.values[ this.set[i] ][ this.set[ii] ] = 0;
          }
        }
      }

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

  , updateMultiEdits: function( $el ){
      var this_ = this;

      var $tds = this.$trs.filter( function(){
        return $(this).data('index') in this_.rowEdits;
      }).find('> td:first-child ~ td').not( $el ).text( $el.text() );

      this.updateValuesWithEl( $tds );

      return this;
    }

  , updateValuesWithEl: function( $el ){
      var this_ = this;
      $el.each( function(){
        var $this = $(this);
        this_.values[ $this.data('x') ][ $this.data('y') ] = Hbs.helpers[
          $this.data('out')
        ]( $this.text() );
      });
    }

  , addToSet: function( val ){
      if ( this.set.indexOf( val ) > -1 ) return this;

      // Add to sorted set
      for ( var i = 0, l = this.set.length; i < l; ++i ){
        if ( this.set[i] > val ){
          var b = this.set.slice( i );
          this.set.length = i;
          this.set.push( val );
          this.set = this.set.concat( b );
          break;
        }

        this.set.push( val );
      }

      // Initialize values
      this.values[ val ] = {};
      for ( var x in this.values ){
        this.values[ x ][ val ] = 0;
        this.values[ val ][ x ] = 0;
      }

      this.render();

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
      var $target = $( e.currentTarget );

      this.updateMultiEdits( $target );
      this.updateValuesWithEl( $target );
    }
  });
});