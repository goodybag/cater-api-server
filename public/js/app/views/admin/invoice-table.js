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
  var api     = require('api')

  var actions = {
    'delete': function( $target, $el, invoiceId ){
      api.invoices( invoiceId ).del( function( error ){
        if ( error ){
          console.error( error );
          return alert('Error deleting invoice. CMD+Shift+J for details');
        }

        $el.remove();
      });
    }

  , 'send-email': function( $target, $el, invoiceId, recipients ){
      var invoiceRecipientEmails = recipients.split(";");

      utils.async.each( invoiceRecipientEmails, function(email, next) {
        if(email) {
          api.invoices( invoiceId )('emails')( email ).post(function( error, result ){
            if ( error ){
              console.error( error );
              return alert('Error sending invoice to ' + email + '. CMD+Shift+J for details');
            }

            // Change label to 'Emailed'
            $el.find('.label-status')
              .removeClass('pending error paid')
              .addClass('emailed')
              .text('Emailed');
          });
        }
      }, function( error ) {
        if(error) {
          console.error( error );
          return alert("Error sending invoice. CMD+SHIFT+J for details");
        }
      });
    }

  , 'set-status': function( $target, $el, invoiceId){
      var status = $target.data('status');
      var $items = $('.list-item.selected');

      utils.async.each( $items, function( item, next ){
        var $item = $(item);
        api.invoices( +$item.data('invoiceId') ).put({ status: status }, next );
      }, function( error ){
        if ( error ){
          console.error( error );
          return alert('Error saving invoice. CMD+Shift+J for details');
        }

        $items.find('.label-status')
          .removeClass('pending emailed error paid')
          .addClass( status )
          .text( status[0].toUpperCase() + status.slice(1) );

        // close the popover
        $el.closest('.open').removeClass('open');
      });
    }
  };

  return function( $el ){
    $el.find('[data-action]').click( function( e ){
      e.preventDefault();

      var $this       = $(this);
      var invoiceId   = +$this.data('invoice-id');
      var recipients  = $this.data('invoice-recipients');
      var action      = $this.data('action');

      actions[ action ]( $this, $('.list-item[data-invoice-id="' + invoiceId + '"]'), invoiceId, recipients );
    })
  };
});
