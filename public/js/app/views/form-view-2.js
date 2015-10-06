/**
 * FormView2
 *
 * A form view
 */

define(function(require){
  var Backbone  = require('backbone');
  var utils     = require('utils');
  var config    = require('config');
  var Hbs       = require('handlebars');

  return Backbone.View.extend({
    // Given an input type ( the key ) and a jquery element
    // ( the value function argument ), what is the value on
    // that jquery element?
    typeGetters: {
      'default':  function( $el ){ return $el.val(); }
    , 'number':   function( $el ){ return +$el.val(); }
    , 'checkbox': function( $el ){ return $el[0].checked; }
    , 'tel':      function( $el ){ return ($el.val().match(/\d/g) || []).join(''); }
    , 'array':    function( $el ){
        var val = $el.val();

        if ( Array.isArray( val ) ){
          return val;
        }

        return $el.val().trim().split(/\,\s*/g);
      }
    , 'number[]': function( $el ){
        return this.typeGetters.array.call( this, $el )
          .map( function( v ){
            return +v;
          });
      }
    , 'list': function( $el ) {
        var result = $el.find('input[type="checkbox"]:checked').map( function() {
          return this.value;
        }).get();

        return result;
      }
    }

    // Change the key used in the inputs `name` attribute to the
    // value mapped here
  , map: {}

  , defaultFieldGetter: function( key ){
      return this.$el.find('[name="' + key + '"]')
    }

    /**
     * Describes which keys should be two-way data-bound
     * {
     *   someKey: true
     * }
     * @type {Object}
     */
  , twoway: {}

  , initialize: function( options ){
      this.options = options;

      this.initTwoWays();

      return this;
    }

  , initTwoWays: function(){
      Object.keys( this.twoway ).forEach( function( key ){
        if ( typeof this.twoway[ key ] !== 'boolean' || !this.twoway[ key ] ) return;

        var methodname = [ 'on', key, 'change' ].join('_');

        this.events['change [name="' + key + '"]'] = methodname;

        this[ methodname ] = function( e ){
          this.model.set( key, this.getDomValue( key, $( e.currentTarget ) ) );
        }.bind( this );

        this.model.on( 'change:' + key, function( model, val ){
          if ( this.getDomValue( key ) === val ) return;
          this.updateDomWithModelProp( key );
        }.bind( this ));
      }.bind( this ));

      this.delegateEvents();

      return this;
    }

    /**
     * Appends errors to the $errors param
     * @param  {Array}    errors  Amanda style errors array or object
     * @param  {Element}  $errors jQuery Element where errors go
     * @param  {Object}   Model   Model to pull the fieldNounMap from
     */
  , displayErrors: function( errors, $errors, Model ){
      var frag = document.createDocumentFragment();
      var template = Handlebars.partials.alert_error;
      var selector = '[name="{property}"]';

      errors = utils.prepareErrors( errors, config.errorTypeMessages, Model );

      frag.innerHTML = "";
      for ( var i = 0, l = errors.length; i < l; ++i ){
        frag.innerHTML += template( errors[i] );
      }

      $errors.html( frag.innerHTML );

      // Highlight form fields with error
      this.$el.find('.has-error').removeClass('has-error');
      this.$el.find(
        '[name="' + utils.pluck( errors, 'property' ).join('"], [name="') + '"]'
      ).parent().addClass('has-error');
    }

    /**
     * Gets the values from input elements whose names correspond
     * to a model attribute key
     * @return {Object} The result
     */
  , getModelData: function(){
      var this_ = this, data = {};

      var map = this.map;

      // Scan all named input elements (only pick checked radio inputs)
      var inputs = this.$el.find('[name][type="radio"]:checked, [name]:not([type="radio"])');

      // Maybe check to see if the name is in schema?
      inputs.each( function(){
        var $this = $(this);
        var k     = $this.attr('name');
        var val   = this_.getDomValue( k, $this );

        data[ k in map ? map[ k ] : k ] = val;
      });

      return data;
    }

    /**
     * Gets a value from an input element for a single attribute
     * @param  {String} key Key name of model attr
     * @param  {jQuery} $el [Optional] scope to search
     * @return {Mixed}      The value
     */
  , getDomValue: function( key, $el ){
      var val, args, helper, type;
      $el = $el || this.defaultFieldGetter( key );

      if ( !$el ) return val;

      type = $el.attr('type') || $el.data('type');

      if ( !( type in this.typeGetters ) ){
        type = 'default';
      }

      val     = this.typeGetters[ type ].call( this, $el );
      helper  = ($el.data('out') || "").split(' ');
      args    = [ val ].concat( helper.slice(1) );
      helper  = helper[0];

      if ( helper && Hbs.helpers[ helper ] ){
        return Hbs.helpers[ helper ].apply( Hbs, args );
      }

      return val;
    }

    /**
     * Updates the model with values from the DOM
     * @return {Object} This instance
     */
  , updateModelWithDom: function(){
      this.model.set( this.getModelData() );
      return this;
    }

    /**
     * Given some props (model attr by default), update DOM
     * @param  {Object} props Update the DOM with
     * @return {Object}       This instance
     */
  , updateDomWithModel: function( props ){
      props = props || this.model.attributes;

      var $el, val;

      for ( var key in props ){
        this.updateDomWithModelProp( key, props );
      }

      return this;
    }

  , updateDomWithModelProp: function( key, props ){
      props = props || this.model.attributes;

      var val;
      var $el = this.$el.find('[name="' + key + '"]');

      if ( $el.length === 0 ) return this;
      if ( this.getDomValue( key, $el ) == this.model.get( key ) ) return this;
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

      return this;
    }
  });
});
