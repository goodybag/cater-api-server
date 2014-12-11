/**
 * Element Toggler
 *
 * Usage:
 * // Automatically wire up elements with the `el-toggler` role
 * require('el-toggler').auto()
 *
 * // Explicit wiring
 * require('el-toggler').init('#my-toggler', {
 *   optional options
 * })
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');

  return Object.create({
    init: function( $el, options ){
      options = utils.defaults( options || {}, {
        activeClass:    'active'
      , targetSelector: '[data-toggler-id="{id}"]'
      });

      $el = utils.dom( $el );

      return Object.create({
        $el:      $el
      , $target:  utils.dom( $el.data('target') || options.target )
      , options:  options

      , init: function(){
          var this_ = this;
          if ( this.$el[0].tagName === 'SELECT' ){
            this.$el.on( 'change', function(){
              this_.show( this_.$el.val() );
            });
          }

          return this;
        }

      , show: function( id ){
          this.$target.find( options.targetSelector.replace( '{id}', id ) )
            .addClass( options.activeClass )
            .siblings( '.' + options.activeClass )
            .removeClass( options.activeClass );

          return this;
        }
      }).init()
    }

  , auto: function(){
      var this_ = this;
      utils.domready( function(){
        utils.dom('[data-role~="el-toggler"]').each( function( el ){
          this_.init( this );
        });
      });
    }
  });
});