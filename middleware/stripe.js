var utils       = require('utils');
var db          = require('db');
var config      = require('config');
var hipchat     = require('../lib/hipchat');
var helpers     = require('../public/js/lib/hb-helpers');
var logger      = require('../lib/logger').create('Stripe');

var eventMessages = {
  'charge.succeeded': function(res) {
    return 'Order #:order_id successfully charged $:amount. <a href=":url">View Details</a>'
      .replace( /:order_id/g, res.data.data.object.metadata.order_id )
      .replace( /:amount/g, helpers.dollars(res.data.data.object.amount) )
      .replace( /:url/g, [ config.baseUrl, 'api', 'stripe-events', res.id ].join('/') );
  }

, 'charge.failed': function(res) {
    return 'Order #:order_id failed to charge $:amount. <a href=":url">View Details</a>'
      .replace( /:order_id/g, res.data.data.object.metadata.order_id )
      .replace( /:amount/g, helpers.dollars(res.data.data.object.amount) )
      .replace( /:url/g, [ config.baseUrl, 'api', 'stripe-events', res.id ].join('/') );
  }

, 'account.updated': function(res) {
    return ':name was updated. Changed :attrs attributes <a href=":url">View Details</a>'
      .replace( /:name/g, res.data.data.object.display_name )
      .replace( /:attrs/g, Object.keys(res.data.data.previous_attributes).join(', ') )
      .replace( /:url/g, [ config.baseUrl, 'api', 'stripe-events', res.id ].join('/') );
  }

, 'default': function(res) {
    return 'Stripe Event <a href=":url">View Details</a>'
      .replace( /:url/g, [ config.baseUrl, 'api', 'stripe-events', res.id ].join('/') );
  }
};

var env = '[:env]'.replace( ':env', helpers.capitalize(config.env) );

var formatMessage = function(res) {
  var type = res.data.type in eventMessages ? res.data.type : 'default';
  return env + ' ' + eventMessages[type](res);
};

var stripe = {
  getStripeEvent: function(options) {
    return function(req, res, next) {
      var logger = req.logger.create('GetStripeEvent');
      db.stripe_events.findOne(req.params.id, function(err, event) {
        if ( err ) {
          logger.error(err);
          return res.send(err);
        }
        if (!event) return res.send(404);

        return res.send(event);
      });
    };
  }

, insertStripeEvent: function(options) {
    return function(req, res, next) {
      var logger = req.logger.create('StripeHooks');
      var data = { data: JSON.stringify(req.body) };
      var $options = { returning: ['*'] };
      db.stripe_events.insert(data, $options, function(err, result) {
        if (err) {
          logger.error('Unable to save stripe event', err);
          return res.send(500);
        }

        hipchat.postMessage({
          room: config.hipchat.rooms.payments
        , from: 'Goodybot'
        , message: formatMessage(result)
        , message_format: 'html'
        , color: 'green'
        , format: 'json'
        },
        function(response) {
          return res.send(response && response.status === 'sent' ? 200 : 500);
        });
      });
    };
  }

, createRestaurantTransfer: function(options) {
    return function(req, res, next) {
      var logger = req.logger.create('Stripe Create Restaurant Transfer');
      var data = req.restaurant_payment = res.locals.restaurant_payment =
        utils.defaults({}, options, {
          amount: req.body.amount
        , destination: req.restaurant.stripe_id
        , currency: 'USD'
        });
      if ( !data.amount || !data.destination )
        return res.send(500, 'Missing required stripe.transfers params');

      utils.stripe.transfers.create(data, function(err, transfer) {
        if ( err ) {
          logger.error('Unable to create transfer');
          return res.send(500, err);
        }
        logger.info('Complete');
        return res.send(200, transfer);
      });
    };
  }

, getRestaurantTransfers: function(options) {
    return function(req, res, next) {
      var logger = req.logger.create('Stripe Get Restaurant Transfers');
      var id = req.restaurant.stripe_id;
      var query = utils.defaults({}, options, {
        destination: id
      , limit: 100
      });
      utils.stripe.transfers.list(query, function(err, transfers) {
        if ( err ) {
          logger.error('Unable to list transfers');
          return res.send(500, err);
        }
        req.restaurant_transfers = res.locals.restaurant_transfers = transfers;
        next();
      });
    };
  }

, verifyRestaurant: function(options) {
    return function(req, res, next) {
      if (!req.restaurant && !req.restaurant.stripe_id) return res.send(500);
      utils.stripe.accounts.update(req.restaurant.stripe_id, {
        legal_entity: {
          type:         req.body.type
        , first_name:   req.body.first_name
        , last_name:    req.body.last_name
        , ssn_last_4:   req.body.ssn_last_4
        }
      , tos_acceptance: {
          ip: req.connection.remoteAddress
        , date: Math.floor(Date.now() / 1000)
        }
      }, function(err, account) {
        if (err) {
          console.log(err);
          logger.error(new Error('Unable to update stripe account'), err);
          return res.send(500, err);
        }
        return next();
      });
    }
  }

, insertRestaurantVerification: function(options) {
    return function(req,res, next) {
      db.restaurant_verifications.insert({
        restaurant_id: req.restaurant.id
      , data: JSON.stringify(req.body)
      }, function(err, result) {
        if (err) {
          console.log(err);
          logger.error(new Error('Unable to insert restaurant_verifications'), err);
          return res.send(500, err);
        }
        next();
      })
    }
  }
};

module.exports = stripe;
