/**
 * Invoice Recipients view
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

  var actions = {
    'add-email': function($target, userId, userName) {
      var newEmail = $target.next().val();

      if(newEmail) {
        api('users')( userId )('invoice-recipients').post({
          name: userName,
          email: newEmail
        }, function(error, results) {
          if(error) {
            flash.info([
              'Oops! Something went wrong!<br><small class="really-small">' + error + '</small>'
            ]);
          } else {
            location.reload();
          }
        });
      }
    }

  , 'edit-email': function($target, userId, userName, userInvoiceId) {
      var updatedEmail = $target.parent().prev().children('input').val();

      api('users')('invoice-recipients')( userInvoiceId ).put({
        email: updatedEmail
      }, function(error, results) {
        if(error) {
          flash.info([
            'Oops! Something went wrong!<br><small class="really-small">' + error + '</small>'
          ]);
        } else {
          location.reload();
        }
      });
    }

  , 'delete-email': function($target, userId, userName, userInvoiceId) {
      console.log("userInvoiceId", userInvoiceId);
      api('users')('invoice-recipients')( userInvoiceId ).del( function(error, result) {
        if(error) {
          flash.info([
            'Oops! Something went wrong!<br><small class="really-small">' + error + '</small>'
          ]);
        } else {
          location.reload();
        }
      });
    }
  };

  return function( $el ){

    $el.find('[data-action]').click( function( e ){
      e.preventDefault();

      var $this         = $(this);
      var userId        = $this.data('user-id');
      var userName      = $this.data('user-name');
      var userInvoiceId = $this.data('user-invoice-id');
      var action        = $this.data('action');

      actions[ action ]( $this, userId, userName, userInvoiceId );
    })
  };
});
