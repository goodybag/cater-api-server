/**
 * Accepted notification
 */

var notifier  = require('../notifier');
var app       = require('../app');

notifier.register({
  name: 'accepted'
, build: function( order, logger, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order.toJSON()
    };

    app.render( 'order-email/order-accepted', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      var email = {
        to:         order.attributes.user.email
      , from:       config.emails.orders
      , subject:    [ 'Goodybag order (#', orderId, ') has been accepted' ].join('')
      , html:       html
      };

      callback( null, email );
    });
  }
});