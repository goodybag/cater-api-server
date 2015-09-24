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
    var actions = {
      'delete': function( $target, $el, rid, id ){
        api('restaurants')( rid )('payment-summaries')( id ).del( function( error ){
          flash.successOrError( error );

          if ( !error ){
            $el.remove();
          }
        });
      }

    , 'email': function( $target, $el, rid, id ){
        api('restaurants')( rid )('payment-summaries')( id )('send').post(
          flash.successOrError.bind( flash )
        );
      }

    , 'email-selected': function(){
        var toEmail = [];

        $el.find('.list-item.selected').each( function(){
          var $pms = $(this);

          toEmail.push({
            id: $pms.data('id')
          , restaurant_id: $pms.data('restaurant-id')
          });
        });

        utils.async.each( toEmail, onPms, flash.successOrError.bind( flash ) );
      }
    };

    $el.delegate( '[data-action]', 'click', function( e ){
      e.preventDefault();

      var $this   = $(this);
      var id      = +$this.data('id');
      var rid     = +$this.data('restaurant-id');
      var action  = $this.data('action');

      actions[ action ](
        $this
      , $('.list-item[data-payment-summary-id="' + id + '"]')
      , rid
      , id
      );
    })
  };
});
