/**
 * Invoice Table view
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var $       = require('jquery');
  var utils   = require('utils');
  var api     = require('api');
  var flash   = require('flash');

  return function( $el, options ){
    if ( !options.restaurant_id ){
      throw new Error('Must provide options.restaurant_id');
    }

    api = api('restaurants')( options.restaurant_id );

    var actions = {
      'delete': function( $target, $el, id, options ){
        api('payment-summaries')( id ).del( function( error ){
          if ( error ){
            console.error( error );
            return flash.info([
              'Error :(<br>'
            , '<small class="really-small">Press CMD+Alt+J</small>'
            ].join(''), 1000 );
          }

          $el.remove();
        });
      }
    };

    $el.delegate( '[data-action]', 'click', function( e ){
      e.preventDefault();

      var $this   = $(this);
      var id      = +$this.data('id');
      var action  = $this.data('action');

      actions[ action ](
        $this
      , $('.list-item[data-payment-summary-id="' + id + '"]')
      , id
      );
    })
  };
});
