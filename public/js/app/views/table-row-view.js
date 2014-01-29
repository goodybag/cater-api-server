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

  , updateDomWithModel: function(){
      var $el, val;

      for ( var key in this.model.attributes ){
        $el = this.$el.find('[name="' + key + '"]');

        if ( $el.length === 0 ) continue;
        if ( this.getDomValue( key, $el ) == this.model.get( key ) ) continue;
        // Do we need to transform the value first?
        if ( $el.data('in') && Hbs.helpers[ $el.data('in') ] ){
          val = Hbs.helpers[ $el.data('in') ].call( Hbs, this.model.attributes[ key ] );
        } else {
          val = this.model.attributes[ key ];
        }

        $el.val( val );
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
      var val;
      $el = $el || this.$el.find('[name="' + key + '"]');

      if ( !$el ) return val;

      val = $el.attr('type') === 'number' ? +$el.val() : $el.val();

      if ( $el.data('out') && Hbs.helpers[ $el.data('out') ] ){
        return Hbs.helpers[ $el.data('out') ].call( Hbs, val );
      }

      return val;
    }

  , onModelChange: function( model, prev ){
      this.updateDomWithModel();
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