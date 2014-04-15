/**
 * Denied notification
 */

var notifier  = require('../order-notifier');
var app       = require('../../app');
var config    = require('../../config');

notifier.register({
  type: 'denied'
, name: 'User Order Denied'
, id: 'user-order-denied'
, description: [
    'If the environment is production and the order is denied, we notify:'
  , '\n  '
  , config.deniedRecipients.join('\n  ')
  , '\n'
  , 'Otherwise, we notify the order user'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order.toJSON()
    };

    var email = {
      to:         config.env === 'production' ?
                    config.deniedReceipients : order.attributes.user.email
    , from:       config.emails.orders
    , subject:    [ 'Goodybag order (#', order.attributes.id, ') has been denied' ].join('')
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/order-denied', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});