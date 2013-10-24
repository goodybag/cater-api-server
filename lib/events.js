var path    = require('path');

var config  = require('../config');
var logger  = require('../logger');
var venter  = require('./venter');
var receipt = require('./receipt');
var utils   = require('../utils');
var app     = require('../app');

var receiptPath = path.resolve( __dirname, '../', config.receipt.dir );

var receiptEvents = {
  // When the order changes, re-build the receipt PDF
  'order:change':
  function( orderId ){
    receipt.build( orderId, function( error ){

    });
  }

  // When the order status changes, send the client an email
  // When the order status changes to accepted, send the client an
  // email with the PDF receipt attached
, 'order:status:change':
  function( order, status ){
    var emailStatuses = [ 'submitted', 'accepted', 'delivered' ];

    if ( utils.contains( emailStatuses, status.attributes.status) ){
      var viewOptions = {
        layout: 'email-layout',
        status: status.toJSON(),
        config: config,
        order:  order.toJSON()
      };
      app.render('email-order-' + status.attributes.status, viewOptions, function(error, html) {
        if ( error ) return logger.events.error( "Error rendering email template", error );

        var email = {
          to:         order.attributes.user.email
        , from:       config.emails.orders
        , subject:    'Goodybag order (#'+ order.attributes.id + ') has been ' + status.attributes.status
        , html:       html
        };

        // If accepted, add the receipt as an attachment
        if ( order.attributes.status === 'accepted' ){
          email.attachment = path.join(
            receiptPath
          , config.receipt.fileName.replace( ':id', order.attributes.id )
          );
        }

        utils.sendMail2( email, function( error ){
          if ( error ) logger.events.error( "Send mail failed", error, order.toJSON() );
        });
      });
    } else if ( status.attributes.status === 'denied' ){
      utils.sendMail(
        config.emails.onDeny || config.emails.orders
      , config.emails.orders
      , 'Order #' + order.attributes.id + ' denied'
      , null
      , config.baseUrl + '/orders/' + order.attributes.id
      );
    }
  }
};

var registerEvent = function( obj, key ){
  venter.on( key, function(){
    var args = arguments;
    process.nextTick( function(){
      obj[ key ].apply( venter, args );
    });
  });
};

Object.keys( receiptEvents ).forEach( utils.partial( registerEvent, receiptEvents ) );