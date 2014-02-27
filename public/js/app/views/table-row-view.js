/**
 * TableRowView
 *
 * Utilized by TableView. Do not instantiate on your own unless
 * you know what you're doing!
 *
 * See TableView
 */

define(function(require){
  var utils = require('utils');
  var Hbs   = require('handlebars');

  return utils.View.extend({
    tagName: 'tr'

  , events: {
      'click .item-edit':   'onItemEditClick'
    , 'input [name]':       'onInputChange'
    , 'click .item-delete': 'onItemDeleteClick'
    }

  , initialize: function( options ){
      this.options = options;

      this.template = options.template;

      this.model.on( 'change',  this.onModelChange, this );
      this.model.on( 'destroy', this.onModelDestroy, this );

      return this;
    }

  , render: function(){
      var $el = utils.dom(
        this.template({
          model:    this.model.toJSON({ cid: true })
        , options:  this.options
        })
      );

      this.setElement( $el[0] );

      return this;
    }

  , updateDomWithModel: function( props ){
      props = props || this.model.attributes;

      var $el, val;

      for ( var key in props ){
        $el = this.$el.find('[name="' + key + '"]');

        if ( $el.length === 0 ) continue;
        if ( this.getDomValue( key, $el ) == this.model.get( key ) ) continue;
        // Do we need to transform the value first?
        if ( $el.data('in') && Hbs.helpers[ $el.data('in') ] ){
          val = Hbs.helpers[ $el.data('in') ].call( Hbs, props[ key ] );
        } else {
          val = props[ key ];
        }

        if ( $el[0].tagName === 'INPUT' ){
          $el.val( val );
        } else {
          $el.html( val );
        }
      }
    }

  , updateModelWithDom: function(){
      var this_ = this, data = {};

      Object.keys( this.model.attributes ).forEach( function( k ){
        var val = this_.getDomValue( k );
        if ( val ) data[ k ] = val;
      });

      this.model.set( data );

      return this;
    }

  , getDomValue: function( key, $el ){
      var val, args, helper;
      $el = $el || this.$el.find('[name="' + key + '"]');

      if ( !$el ) return val;

      val     = $el.attr('type') === 'number' ? +$el.val() : $el.val();
      helper  = ($el.data('out') || "").split(' ');
      args    = [ val ].concat( helper.slice(1) );
      helper  = helper[0];

      if ( helper && Hbs.helpers[ helper ] ){
        return Hbs.helpers[ helper ].apply( Hbs, args );
      }

      return val;
    }

  , onModelChange: function( model, prev ){
      this.updateDomWithModel( model.changed );
    }

  , onItemDeleteClick: function( e ){
      this.model.destroy();
    }

  , onModelDestroy: function(){
      this.remove();
    }

  , onItemEditClick: function( e ){
      if ( this.options.onItemEditClick ){
        this.options.onItemEditClick.call( this, this.model );
      }
    }

  , onInputChange: function( e ){
      this.model.set(
        e.target.name
      , this.getDomValue( e.target.name )
      );
    }
  });
});