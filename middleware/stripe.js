var utils       = require('utils');
var db          = require('db');
var config      = require('config');
var hipchat     = require('../lib/hipchat');
var helpers     = require('../public/js/lib/hb-helpers');
var logger      = require('../lib/logger').create('Stripe');
var moment      = require('moment-timezone');

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

      var dob = moment(req.body.dob, 'MM-DD-YYYY');
      var data = {
        legal_entity: {
          type: req.body.type
        , first_name: req.body.first_name
        , last_name: req.body.last_name
        , personal_id_number: req.body.personal_id_number // SSN
        , business_tax_id: req.body.business_tax_id // EIN
        , ssn_last_4: req.body.ssn_last_4
        , business_name: req.body.business_name
        , dob: {
            day: dob.date()
          , month: dob.month() + 1
          , year: dob.year()
          }
        , address: {
            line1: req.body.line1
          , line2: req.body.line2
          , city: req.body.city
          , state: req.body.state
          , postal_code: req.body.postal_code
          }
        }
      , tos_acceptance: {
          ip: req.connection.remoteAddress
        , date: Math.floor(Date.now() / 1000)
        }
      , bank_account: {
          routing_number: req.body.routing_number
        , account_number: req.body.account_number
        , country: 'US'
        , currency: 'USD'
        }
      };

      if ( data.legal_entity.type === 'individual' ) {
        delete data.legal_entity.business_tax_id;
        delete data.legal_entity.ssn_last_4;
      } else {
        delete data.legal_entity.personal_id_number;
      }

      utils.stripe.accounts.update(req.restaurant.stripe_id, data, function(err, account) {
        if (err) {
          logger.error('Unable to update stripe account', err);
          // Propagate validation error and original req body fields to form
          res.locals.error = err;
          res.locals.data = data;
          res.locals.dob = req.body.dob;
          return res.render('verify/stripe', { layout: 'layout/default' });
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
          logger.error('Unable to insert restaurant_verifications', err);
          return res.send(500, err);
        }
        next();
      });
    }
  }
};

module.exports = stripe;
