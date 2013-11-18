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
  function( order ){
    var emailStatuses = [ 'submitted', 'accepted', 'delivered' ];
    var orderId       = order.attributes.id;
    var statusText    = order.attributes.status;

    // Rebuild receipt
    receipt.build( orderId, function( error ){
      if ( error ) logger.events.error( "Error building receipt", orderId, error );
    });

    if ( utils.contains( emailStatuses, statusText ) ){
      utils.stage({
        'start':
        function( stage, done ){
          stage('render-email');
        }

      , 'render-email':
        function( stage, done ){
          var viewOptions = {
            layout: 'email-layout',
            config: config,
            order:  order.toJSON()
          };

          app.render( 'email-order-' + statusText, viewOptions, function( error, html ){
            if ( error ){
              logger.events.error("Error rendering tempalte");
              return done( error );
            }

            var email = {
              to:         order.attributes.user.email
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

      , 'add-attachment':
        function( email, stage, done ){
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

      , 'send-email':
        function( email, stage, done ){
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
            utils.sendMail2( email, done );
          });
        }
      })( function( error ){
        if ( error ) return logger.events.error( error );
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

var restaurantEmail = {
  'order:status:change':
  function( order ){
    var orderId = order.attributes.id;
    var statusText = order.attributes.status;

    if ( ['submitted', 'canceled'].indexOf( statusText ) === -1 ) return;

    var view = {
      order:    order.toJSON({ review: true })
    , config:   config
    , layout:   'email-layout'
    };

    if ( statusText === 'canceled' ){
      app.render( 'email-order-canceled', view, function( error, html ){
        if ( error ) return logger.events.error( error );

        var email = {
          to:         order.attributes.restaurant.email
        , from:       config.emails.orders
        , html:       html
        , subject: [ 'Goodybag Order (#', order.attributes.id, ') has been canceled' ].join('')
        };

        utils.sendMail( email, function( error ){
          if ( error ) return logger.events.error( error );
        });
      });

      return;
    }

    // Order submitted, we need to attach PDF to the email

    // Just in case, re-build the receipt even though other events probably
    // dispatched the same request. It doesn't matter though because the async
    // queue will take care of any duplicate jobs
    receipt.build( orderId, function( error ){
      if ( error ) logger.events.error( "Error building receipt", orderId, error );
    });

    utils.stage({
      'start':
      function( stage, done ){
        stage('render-email');
      }

    , 'render-email':
      function( stage, done ){
        app.render( 'email-order-submitted', view, function( error, html ){
          if ( error ){
            logger.events.error("Error rendering tempalte");
            return done( error );
          }

          var email = {
            to:         order.attributes.restaurant.email
          , from:       config.emails.orders
          , subject:    'You have received a new Goodybag Order #' + orderId
          , html:       html
          };

          stage( 'add-attachment', email );
        });
      }

    , 'add-attachment':
      function( email, stage, done ){
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

    , 'send-email':
      function( email, stage, done ){
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

          utils.sendMail2( email, done );
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
    if ( order.attributes.status !== 'accepted' ) return;
    utils.post('http://gb-prod-alert.j0.hn/deployments/accepted');
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
registerEventGroup( restaurantEmail );
registerEventGroup( jukebox );