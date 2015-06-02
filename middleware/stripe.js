var utils       = require('utils');
var db          = require('db');
var config      = require('config');
var hipchat     = require('../lib/hipchat');

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

        var message = 'Stripe Webhook ' +
          [config.baseUrl, 'api', 'stripe-events', result.id].join('/');

        hipchat.postMessage({
          room: config.hipchat.rooms.tech
        , from: 'Goodybot'
        , message: message
        , message_format: 'text'
        , color: 'green'
        , format: 'json'
        },
        function(response) {
          return res.send(response && response.status === 'sent' ? 200 : 500);
        });
      });
    }
  }
};

module.exports = stripe;
