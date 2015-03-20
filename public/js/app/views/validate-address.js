/**
 * ValideAddress
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var api   = require('api');
  var utils = require('utils');

  return utils.View.extend({
    _state:   'pending'
  , states:   ['pending', 'error', 'success']
  , initialize: function( options ){
      this.options = utils.defaults( options || {}, {
        inputDebounceInterval: 260
      });

      this.$el.on(
        'input', _.debounce( this.onChange.bind( this ), this.options.inputDebounceInterval )
      );

      this.$wrapper = this.$el.closest('.form-group');

      this.renderState();

      return this;
    }

  , state: function( state ){
      if ( this.states.indexOf( state ) === -1 ){
        throw new Error('Invalid state')
      }

      this._state = state;
      this.renderState();
      return this;
    }

  , getStateSymbol: function(){
      return ({
        pending:  '…'
      , error:    '<span class="gb-icon-x-mark"></span>'
      , success:  '<span class="gb-icon-checkmark"></span>'
      })[ this._state ];
    }

  , renderState: function(){
      this.$wrapper
        .removeClass( this.states.join(' ') )
        .addClass( this._state )
        .find('.input-addon')
        .html( this.getStateSymbol() );

      return this;
    }

  , validateAddress: function( address, callback ){
      callback = callback || utils.noop;

      api.maps.validateAddress( address, function( error, result ){
        if ( error ){
          return this.state('error');
        }

        this.state( result.valid ? 'success': 'error' );
      }.bind( this ));
    }

  , onChange: function( e ){
      e.preventDefault();
      this.validateAddress( $( e.target ).val() );
    }
  });
});
