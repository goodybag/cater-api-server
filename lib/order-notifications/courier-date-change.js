/*
 * Courier Date Change Notification
 */

var notifier  = require('../order-notifier');
var config    = require('../../config');
var app       = require('../../app');
var utils     = require('../../utils');
var db        = require('../../db');

notifier.register({
  type: 'changed'
, id: 'order-courier-date-changed'
, name: 'Delivery Service Order Date Changed'
, description: [
    'Sends an email notifying the delivery service that an order delivery date was changed'
  ].join('')
, isAvailable: function( order ){
    return order.type === 'courier' && !!order.delivery_service_id;
  }
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout:  false
    , config:  config
    , order:   order
    };

    utils.async.waterfall([
      function( next ){
        if ( !options.delivery_service_id ){
          return next( null, order.deliveryService );
        }

        db.delivery_services.findOne( options.delivery_service_id, next );
      }

    , function( deliveryService, next ){
        var email = {
          to:         deliveryService.order_email.split(',')
        , from:       config.emails.couriers
        , subject:    'Goodybag Order #' + order.id + ' delivery date has been changed!'
        };

        logger.debug( 'Setting up email', email );

        if ( options.render === false ){
          return callback( null, email );
        }

        app.render( 'order-email/order-courier-date-changed', viewOptions, function( error, html ){
          if ( error ){
            return callback( error );
          }

          email.html = html;

          callback( null, email );
        });
      }
    ], function( error ){
      if ( error ){
        return callback( error );
      }
    });
  }
});
