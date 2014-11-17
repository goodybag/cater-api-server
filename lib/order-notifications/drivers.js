var notifier  = require('../order-notifier');
var scheduler = require('../scheduler');
var config    = require('../../config');
var app       = require('../../app');
var db        = require('../../db');
var utils     = require('../../utils');
var errors    = require('../../errors');

notifier.register({
  type: 'submitted'
, id: 'driver-order-request'
, name: 'Driver Order Request'
, format: 'sms'
, options: ['order_driver_request_id']
, description: [
    'Sends a Goodybag driver a text requesting that they deliver an order.'
  , '*Note* this requires an existing order_driver_request record for this order.'
  , 'If you do not provide `order_driver_request_id`, this notification looks up'
  , 'the latest one for this order. If one does not exist, we send back an error.'
  ].join(' ')
, build: function( order, logger, options, callback ){
    logger = logger.create('DriverOrderRequest');

    utils.async.waterfall([
      function( done ){
        var $where = {};

        var options = {
          order: 'id desc'
        , one:    [ { table: 'users', alias: 'user' }
                  , { table: 'orders', alias: 'order' }
                  ]
        };

        if ( order_driver_request_id ){
          $where.id = order_driver_request_id;
        } else {
          $where.order_id = order.id;
        }

        db.order_driver_requests.findOne( $where, options, done );
      }

    , function( driver_request, done ){
        if ( !driver_request ){
          logger.info('Could not look up driver_request');
          return done( errors.internal.NOT_FOUND );
        }

        var url = [
          config.baseUrl
        , 'orders'
        , order.id
        , 'driver-requests'
        , driver_request.id
        ].join('/');

        logger.info( 'Shortening URL', url );

        utils.bitly.shorten( driver_request, url, done );
      }

    , function( driver_request, response, done ){
        var url = ((response||0).data||0).url;

        if ( typeof url !== 'string' ){
          return done( errors.bitly.BAD_RESPONSE_URL );
        }

        var viewOptions = {
          layout:               false
        , order_driver_request: order
        , url:                  url
        };

        app.render( 'sms/rorder-driver-request', viewOptions, function( error, html ){
          callback( error, {
            to:     driver_request.user.phone
          , from:   config.phone.orders
          , html:   html
          });
        });
      }
    ], callback );

    var url = config.baseUrl + '/orders/' + order.id + '?review_token=' + order.review_token;
    utils.bitly.shorten(url, function(err, response) {
      if (err) {
        logger.error('unable to shorten url, attempting to sms unshortend link', err);
      }

      url = ((response||0).data||0).url || url;

      var viewOptions = {
        layout: false
      , order: order
      , url: url
      };

      var sms_phones = utils.flatten(utils.pluck(order.restaurant.contacts, 'sms_phones'));
      var notification = {
        to: sms_phones
      , from: config.phone.orders
      };
      app.render( 'sms/restaurant-order-submitted-sms', viewOptions, function( error, html ){
        notification.html = html;
        callback(error, notification);
      });
    });
  }
});