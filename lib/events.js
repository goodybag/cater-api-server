var path      = require('path');
var moment    = require('moment-timezone');
var config    = require('../config');
var logger    = require('../logger');
var venter    = require('./venter');
var utils     = require('../utils');
var app       = require('../app');
var helpers   = require('../public/js/lib/hb-helpers');
var welcome   = require('./welcome-emailer');
var notifier  = require('./order-notifier');
var scheduler = require('./scheduler');
var pdfs      = require('./pdfs');
var Bitly     = require('bitly');
var bitly     = new Bitly(config.bitly.username, config.bitly.apiKey);

var receiptEvents = {
  // When the order changes, re-build the receipt PDF
  'order:change':
  function( orderId ){
    pdfs.receipt.build({ orderId: orderId }, function( error ){
      if ( error ){
        logger.scheduler.error( 'Could not schedule receipt build: ' + orderId, error );
      }
    });

    pdfs.manifest.build({ orderId: orderId }, function( error ){
      if ( error ){
        logger.scheduler.error( 'Could not schedule manifest build: ' + orderId, error );
      }
    });
  }

  // When the order status changes, send the client an email
  // When the order status changes to delivered, send the client an
  // email with the PDF receipt attached
, 'order:status:change':
  function( order, previous ){
    var emailStatuses = [ 'submitted', 'accepted', 'denied' ];
    var orderId       = order.attributes.id;
    var statusText    = order.attributes.status;

    if ( !utils.contains( emailStatuses, statusText ) ) return;

    pdfs.receipt.build({ orderId: orderId }, function( error ){
      if ( error ){
        logger.scheduler.error( 'Could not schedule receipt build: ' + orderId, error );
      }
    });

    order.getOrderItems( function( error, items ){
      if ( error ){
        return logger.events.error( 'Error getting order items', error );
      }

      order.attributes.orderItems = items;

      notifier.send( 'user-order-' + statusText, order.toJSON() );
    });
  }
};

// Handle restaurant submitted orders
var restaurantSubmittedOrders = {
  'order:status:change':
  function( order, previous ){
    var TAGS = ['restaurant-submitted-orders'];
    var orderId = order.attributes.id;
    var statusText = order.attributes.status;

    if ( statusText !== 'submitted' ) return;

    pdfs.manifest.build({ orderId: orderId }, function( error ){
      if ( error ){
        logger.scheduler.error( 'Could not schedule manifest build: ' + orderId, error );
      }
    });

    order.getRestaurant( function( error ){
      if ( error ){
        return logger.events.error( 'Error getting order restaurant', error );
      }

      // Manually handle orders set for DS and over a certain amount
      if ( order.attributes.type === 'courier' )
      if ( order.attributes.sub_total >= order.attributes.restaurant.delivery_service_order_total_upperbound ){
        return;
      }

      // Email Notification
      order.getOrderItems( function( error, items ){
        if ( error ){
          return logger.events.error( 'Error getting order items', error );
        }

        order.attributes.orderItems = items;

        notifier.send( 'restaurant-order-submitted', order.toJSON({ review: true }) );
      });

      // Phone Notification
      if (order.attributes.restaurant.voice_phones) {
        logger.routes.info(TAGS, "making call for order: " + order.attributes.id);
        var datetime = utils.getWorkingTime(moment(), order.attributes.timezone);
        utils.each(order.attributes.restaurant.voice_phones, function(voice_phone) {
          scheduler.enqueue('make-call', datetime.toString(), {
            to: voice_phone,
            from: config.phone.orders,
            url: config.baseUrl + '/orders/' + order.attributes.id + '/voice',
            ifMachine: 'Continue',
            method: 'GET'
          }, function(err, result) {
            if ( err ) logger.scheduler.error(TAGS, 'unable to schedule call', err);
          });
        });
      }

      // Text Notification
      if (order.attributes.restaurant.sms_phones) {
        logger.routes.info(TAGS, "shortening url and sending sms for order: " + order.attributes.id);
        var url = config.baseUrl + '/orders/' + order.attributes.id + '?review_token=' + order.attributes.review_token;

        // shorten URL
        bitly.shorten(url, function(err, response) {
          if (err) logger.routes.error(TAGS, 'unable to shorten url, attempting to sms unshortend link', err);
          url = ((response||0).data||0).url || url;
          // send sms
          var msg = [
            'New Goodybag order for $'
          , (parseInt(order.attributes.total) / 100).toFixed(2)
          , ( order.attributes.type === 'delivery' ) ?
              ' to be delivered on ' + moment(order.attributes.datetime).format('MM/DD/YYYY h:mm a') + '.' :
              ' for pickup on ' + moment(order.attributes.pickup_datetime).format('MM/DD/YYYY h:mm a') + '.'
          , '\n'
          , url
          ].join('');

          utils.each(order.attributes.restaurant.sms_phones, function(sms_phone) {
            scheduler.enqueue('send-sms', new Date(), {
              to: sms_phone,
              from: config.phone.orders,
              body: msg
            }, function(err, result) {
              if ( err ) logger.scheduler.error( TAGS, 'unable to schedule text', err );
            });
          });
        });
      }
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

    order.getOrderItems( function( error, items ){
      if ( error ){
        return logger.events.error( 'Error getting order items', error );
      }

      order.attributes.orderItems = items;

      order = order.toJSON();
      notifier.send( 'user-order-canceled', order );
      notifier.send( 'restaurant-order-canceled', order );
      notifier.send( 'goodybaggers-order-canceled', order );
    });
  }
};

var pmsEvents = {
  'payment-summary:change':
  function( psid, psrid ){
    pdfs.pms.build({ id: psid, restaurant_id: psrid }, function( error ){
      if ( error ){
        logger.scheduler.error( 'Could not schedule pms build: ' + psid, error );
      }
    });
  }
};

var welcomes = {
  // Send welcome email
  'user:registered':
  function( user ){
    var time  = new moment().tz( user.attributes.timezone || config.welcome.timezone );
    var min   = new moment().tz( user.attributes.timezone || config.welcome.timezone );
    var max   = new moment().tz( user.attributes.timezone || config.welcome.timezone );

    min.set( 'hour', +config.welcome.beginTime.split(':')[0] );
    min.set( 'minute', +config.welcome.beginTime.split(':')[1] );
    max.set( 'hour', +config.welcome.endTime.split(':')[0] );
    max.set( 'minute', +config.welcome.endTime.split(':')[1] );

    if ( time < min ){
      time.set( 'hour', min.get('hour') );
      time.set( 'minute', min.get('minute') );

    // We need to advance the day by 1 and set the hh:mm since
    // the time has already passed
    // If this is a Friday, the day becomes Saturday, which will
    // fail the `isValidDay` check, then the day will be set to Monday
    } else if ( time > max ){
      time.add( 'days', 1 );
      time.set( 'hour', min.get('hour') );
      time.set( 'minute', min.get('minute') );
    }

    if ( !welcome.isValidDayForUser( time, user ) ){
      time = time.day( config.welcome.days[0] );
    }

    scheduler.enqueue( 'send-welcome-email-1', time.tz('UTC').toDate(), user.toJSON() );
  }
};

var rewards = {
  'reward:redeemed':
  function( reward, userId ){
    logger.points.info( 'Redemption', reward, userId );
    var now = ( new moment() ).tz('UTC').toDate();
    scheduler.enqueue( 'redeem-reward', now, {
      reward: reward
    , userId: userId
    });
  }
};

var deliveryServices = {
  'order:status:change':
  function notifyAcceptedOrder( order, previous ){
    if ( order.attributes.type !== 'courier' ) return;

    order.getRestaurant( function( error ){
      if ( error ){
        return logger.events.error( 'Error getting order restaurant', error );
      }

      var submitted = moment.tz(order.attributes.submitted, order.attributes.timezone);
      var day = submitted.day();
      var hour = submitted.hour();
      var weekend = ( day == 0 || day == 6 );
      var afterHours = ( hour >= 17 || hour <= 8 );

      if ( order.attributes.status === 'submitted' ){
        if ( weekend || afterHours ) {
          scheduler.enqueue('sms-gb-ds-after-hours', new Date(), { orderId: order.attributes.id });
        }
        // over the threshold, do not send to DS, just notify goodybaggers
        if ( order.attributes.sub_total >= order.attributes.restaurant.delivery_service_order_total_upperbound ){
          return notifier.send( 'delivery-service-order-above-threshold', order.toJSON() );
        } else {
          notifier.send( 'goodybaggers-ds-order', order.attributes.id );
        }
      }

      if ( order.attributes.status === 'accepted' ){
        scheduler.enqueue('notify-delivery-service', new Date(), { orderId: order.attributes.id });
      }
    });
  }
};

var restaurants = {
  'restaurant_request:created':
  function onRestaurantContactCreate( rRequest ){
    utils.sendMail2({
      to: config.restaurantRequestRecipients
    , from: config.emails.info
    , subject: '[Restaurant Request] Restaurant inquiring about Goodybag'
    , html: [
        '<p>A restaurant just requested to be a caterer. Here are the details</p>'
      ].concat(
        Object.keys( rRequest ).map( function( k ){
          return [
            '<div style="margin-top: 12px">'
          , '  <strong style="display: inline-block; width: 110px">' + k + ':</strong>'
          , rRequest[ k ]
          , '</div>'
          ].join('')
        })
      ).join('\n')
    })
  }
}

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
registerEventGroup( jukebox );
registerEventGroup( pmsEvents );
registerEventGroup( welcomes );
registerEventGroup( rewards );
registerEventGroup( deliveryServices );
registerEventGroup( restaurants );
