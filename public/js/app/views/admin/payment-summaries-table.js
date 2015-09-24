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

    , 'email': function( $target, $el, rid, id ){
        api('restaurants')( rid )('payment-summaries')( id )('send').post( function( error ){
          if ( error ){
            console.error( error );
            return flash.info([
              'Error :(<br>'
            , '<small class="really-small">Press CMD+Alt+J</small>'
            ].join(''), 1000 );
          }

          flash.info([
            'Success!<br>'
          , '<small class="really-small">Now get back to being who you want to be!</small>'
          ].join(''), 1000 );
        });
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
        return console.log('email-selected', toEmail);

        // utils.async.each( toEmail, onPms, function( error, ))
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
