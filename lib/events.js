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
      if ( error ) logger.events.error( "Error building receipt", orderId, error );
    });
  }

  // When the order status changes, send the client an email
  // When the order status changes to accepted, send the client an
  // email with the PDF receipt attached
, 'order:status:change':
  function( order, status ){
    var emailStatuses = [ 'submitted', 'accepted', 'delivered' ];
    var orderId       = order.attributes.id;
    var statusText    = status.attributes.status;

    if ( utils.contains( emailStatuses, statusText ) ){
      var viewOptions = {
        layout: 'email-layout',
        status: status.toJSON(),
        config: config,
        order:  order.toJSON()
      };

      app.render( 'email-order-' + statusText, viewOptions, function( error, html ){
        if ( error ) return logger.events.error( "Error rendering email template", error );

        var email = {
          to:         order.attributes.user.email
        , from:       config.emails.orders
        , subject:    [ 'Goodybag order (#', orderId, ') has been ', statusText ].join('')
        , html:       html
        };

        // If accepted, add the receipt as an attachment
        if ( statusText === 'accepted' ){
          email.attachment = {
            filePath: path.join(
              receiptPath
            , config.receipt.fileName.replace( ':id', orderId )
            )
          };
        }

        // If is accepted and the order is currently in the receipt queue
        // wait until it has finished before sending email with attachment
        (function( next ){
          if (
            statusText !== 'accepted' ||
            !receipt.orderInQueue( orderId ) &&
            !receipt.orderIsProcessing( orderId )
          ) return next();

          receipt.once( [ 'receipt', orderId, 'generated' ].join(':'), next );

        // Next callback
        })(function(){
          utils.sendMail2( email, function( error ){
            if ( error ) logger.events.error( "Send mail failed", error, order.toJSON() );
          });
        });
      });
    } else if ( statusText === 'denied' ){
      utils.sendMail(
        config.emails.onDeny || config.emails.orders
      , config.emails.orders
      , 'Order #' + orderId + ' denied'
      , null
      , config.baseUrl + '/orders/' + order.attributes.id
      );
    }
  }
};

/**
 * Registers an event defined in obj onto venter.on( key )
 * Waits until nextTick
 * @param  {Object} obj The events object to read from
 * @param  {String} key The event name
 */
var registerEvent = function( obj, key ){
  venter.on( key, function(){
    var args = arguments;
    process.nextTick( function(){
      obj[ key ].apply( venter, args );
    });
  });
};

// Register all of receiptEvents
Object.keys( receiptEvents ).forEach( utils.partial( registerEvent, receiptEvents ) );