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

  , 'send-email': function( $target, $el, invoiceId ){
      api.invoices( invoiceId )('emails').post( function( error, result ){
        if ( error ){
          console.error( error );
          return alert('Error sending invoice. CMD+Shift+J for details');
        }

        // Change label to 'Emailed'
        $el.find('.label-status')
          .removeClass('pending error paid')
          .addClass('emailed')
          .text('Emailed');
      });
    }

  , 'send-emails': function( $target, $el, invoiceId ) {
      var $items = $('.list-item.selected');
      var $emails = $('.selected-email .email-text');

      utils.async.each( $items, function(item, next) {
        var $item = $(item);
        var id = +$item.data('invoiceId');

        utils.async.each( $emails, function(email, next) {
          var email = $(email).html();

          api.invoices( id )( email )('emails').post( function( error, result ){
            if( error ){
              console.error( error );
              return alert('Error sending invoice. CMD+SHIFT+J for details');
            }

            // Change label to 'Emailed'
            $el.find('.label-status')
              .removeClass('pending error paid')
              .addClass('emailed')
              .text('Emailed');

            alert("Email has been sent!");
            location.reload();

          });

        }, function( error ) {
          if(error) {
            console.error( error );
            return alert('An error occurred. CMD+Shift+J for details');
          }
        });

      }, function( error ) {
        if(error) {
          console.error( error );
          return alert('An error occurred. CMD+Shift+J for details');
        }
      });
    }

  , 'set-status': function( $target, $el, invoiceId ){
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

  , 'save-emails': function( $target, $el, invoiceId, userId, userName ){
      var emailStr = $target.context.previousElementSibling.value;
      if(emailStr) {
        if(validateEmail(emailStr)) {
          api.invoices('recipients').post({
            user_id: userId,
            name: userName,
            email: emailStr
          }, function(error, result) {
            if(error) {
              console.error("There was an error." +  error);
            } else {
              alert(emailStr + " has been successfully added!");
              location.reload();
            }
          });
        } else {
          return alert('\'' + emailStr + '\' is not a valid email address.\
                       \nThis address was not saved.');
        }
      }
    }
  };

  var validateEmail = function(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
  }

  return function( $el ){
    $el.find('[data-action]').click( function( e ){
      e.preventDefault();

      var $this       = $(this);
      var invoiceId   = +$this.data('invoice-id');
      var userId      = $this.data('user-id');
      var userName    = $this.data('user-name');
      var action      = $this.data('action');

      actions[ action ]( $this, $('.list-item[data-invoice-id="' + invoiceId + '"]'), invoiceId, userId, userName );
    })
  };
});
