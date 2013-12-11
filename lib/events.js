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
  // When the order status changes to delivered, send the client an
  // email with the PDF receipt attached
, 'order:status:change':
  function( order, previous ){
    var emailStatuses = [ 'submitted', 'accepted', 'delivered', 'denied' ];
    var orderId       = order.attributes.id;
    var statusText    = order.attributes.status;

    if ( !utils.contains( emailStatuses, statusText ) ) return;

    // Rebuild receipt
    receipt.build( orderId, function( error ){
      if ( error ) logger.events.error( "Error building receipt", orderId, error );
    });

    utils.stage({
      'start': function( stage, done ){
        if ( statusText === 'denied' ) return stage('render-email');

        stage('get-order-items');
      }

    , 'get-order-items': function( stage, done ){
        order.getOrderItems( function( error, items ){
          if ( error ) return done( error );

          order.attributes.orderItems = items;

          stage('render-email');
        });
      }

    , 'render-email': function( stage, done ){
        var viewOptions = {
          layout: 'email-layout',
          config: config,
          order:  order.toJSON()
        };

        app.render( 'order-email/order-' + statusText, viewOptions, function( error, html ){
          if ( error ){
            logger.events.error("Error rendering tempalte");
            return done( error );
          }

          // temporarily redirect denied emails to jag and sarah for remediation
          var email = {
            to:         statusText === 'denied' ? config.emails.denied : order.attributes.user.email
          , from:       config.emails.orders
          , subject:    [ 'Goodybag order (#', orderId, ') has been ', statusText ].join('')
          , html:       html
          };

          if ( statusText === 'delivered'){
            stage( 'add-attachment', email );
          } else {
            stage( 'send-email', email );
          }
        });
      }

    , 'add-attachment': function( email, stage, done ){
        receipt.get( orderId, function( error, res ){
          if ( error ){
            logger.events.error("Error getting receipt #" + orderId + " from S3");
            return done( error );
          }

          email.attachment = {
            streamSource: res
          , contentType: 'application/pdf'
          , fileName: receipt.getFileName( orderId )
          };

          stage( 'send-email', email );
        });
      }

    , 'send-email': function( email, stage, done ){
        // If is delivered and the order is currently in the receipt queue
        // wait until it has finished before sending email with attachment
        (function( next ){
          // Receipt could have been re-built, if so, lets wait for the latest
          if (
            statusText !== 'delivered' ||
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
      }
    })( function( error ){
      if ( error ) return logger.events.error( error );
    });
  }
};

// Handle restaurant submitted orders
var restaurantSubmittedOrders = {
  'order:status:change':
  function( order, previous ){
    var orderId = order.attributes.id;
    var statusText = order.attributes.status;

    if ( statusText !== 'submitted' ) return;

    var view = {
      order:    order.toJSON({ review: true })
    , config:   config
    , layout:   'email-layout'
    };

    // Order submitted, we need to attach PDF to the email

    // Just in case, re-build the receipt even though other events probably
    // dispatched the same request. It doesn't matter though because the async
    // queue will take care of any duplicate jobs
    receipt.build( orderId, function( error ){
      if ( error ) logger.events.error( "Error building receipt", orderId, error );
    });

    utils.stage({
      'start': function( stage, done ){
        stage('get-order-items');
      }

    , 'get-order-items': function( stage, done ){
        order.getOrderItems( function( error, items ){
          if ( error ) return done( error );

          view.order.orderItems = utils.invoke( items, 'toJSON' );

          stage('render-email');
        });
      }

    , 'render-email': function( stage, done ){
        app.render( 'order-email/order-submitted', view, function( error, html ){
          if ( error ){
            logger.events.error("Error rendering tempalte");
            return done( error );
          }

          var email = {
            to:         order.attributes.restaurant.emails
          , from:       config.emails.orders
          , subject:    'You have received a new Goodybag Order #' + orderId
          , html:       html
          };

          // stage( 'add-attachment', email );
          stage ('send-email', email);
        });
      }

    // , 'add-attachment': function( email, stage, done ){
    //     receipt.get( orderId, function( error, res ){
    //       if ( error ){
    //         logger.events.error("Error getting receipt #" + orderId + " from S3");
    //         return done( error );
    //       }

    //       email.attachment = {
    //         streamSource: res
    //       , contentType: 'application/pdf'
    //       , fileName: receipt.getFileName( orderId )
    //       };

    //       stage( 'send-email', email );
    //     });
    //   }

    , 'send-email': function( email, stage, done ){
        // If is accepted and the order is currently in the receipt queue
        // wait until it has finished before sending email with attachment
        (function( next ){
          if (
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
      }
    })( function( error ){
      if ( error ) return logger.events.error( error );
    });
  }
};

var jukebox = {
  'order:status:change':
  function( order ){
    if ( config.env !== 'production' ) return;
    if ( order.attributes.status !== 'accepted' ) return;
    if (
      order.attributes.user && typeof order.attributes.user.email === 'string' &&
      order.attributes.user.email.indexOf('@goodybag.com') > -1
    ) return;

    utils.post('http://gb-prod-alert.j0.hn/deployments/accepted', order.toJSON());
  }
};

// Send client and restaurant an email about canceled orders
var clientRestaurantCanceledOrders = {
  'order:status:change': function( order, previous ){
    var orderId    = order.attributes.id;
    var statusText = order.attributes.status;

    // Only respond to canceled orders that were submitted or accepted
    if ( statusText !== 'canceled' ) return;
    if ( ['submitted', 'accepted'].indexOf( previous ) === - 1 ) return

    var email = {
      from:       config.emails.orders
    , subject: [ 'Goodybag Order (#', order.attributes.id, ') has been canceled' ].join('')
    };

    var view = {
      layout: 'email-layout'
    , config: config
    };

    // Render Restaurant email
    app.render(
      'order-email/order-canceled'
    , utils.extend( {}, view, { order: order.toJSON({ review: true }) } )
    , function( error, html ){
        if ( error ) return logger.events.error( error );

        utils.sendMail(
          utils.extend( {}, email, { html: html, to: order.attributes.restaurant.email } )
        , function( error ){
            if ( error ) return logger.events.error( error );
          }
        );
      }
    );

    // Render Client email
    app.render(
      'order-email/order-canceled'
    , utils.extend( {}, view, { order: order.toJSON() } )
    , function( error, html ){
        if ( error ) return logger.events.error( error );

        utils.sendMail(
          utils.extend( {}, email, { html: html, to: order.attributes.user.email } )
        , function( error ){
            if ( error ) return logger.events.error( error );
          }
        );
      }
    );
  }
};

var orderChangeStatusEvents = {
  'order-change:status:change': function(change, oldStatus) {
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

var registerEventGroup = function( group ){
  Object.keys( group ).forEach( utils.partial( registerEvent, group ) );
};

// Register all of events
registerEventGroup( receiptEvents );
registerEventGroup( restaurantSubmittedOrders );
registerEventGroup( clientRestaurantCanceledOrders );
registerEventGroup( orderChangeStatusEvents );
registerEventGroup( jukebox );
