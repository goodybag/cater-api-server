var db      = require('../../db');
var errors  = require('../../errors');
var utils   = require('../../utils');
var config  = require('../../config');
var states  = require('../../public/states');
var models  = require('../../models');
var logger  = require('../../logger');
var receipt = require('../../lib/receipt');
var venter  = require('../../lib/venter');

// var static = require('node-static');
var moment = require('moment');
var twilio = require('twilio')(config.twilio.account, config.twilio.token);
var Mailgun = require('mailgun').Mailgun;
var MailComposer = require('mailcomposer').MailComposer;

// var fileServer = new static.Server('../../public/receipts');

var Bitly = require('bitly');
var bitly = new Bitly(config.bitly.username, config.bitly.apiKey);

module.exports.auth = function(req, res, next) {
  var TAGS = ['orders-auth'];

  logger.db.info(TAGS, 'auth for order #'+ req.params.id);
  if (req.session.user != null && utils.contains(req.session.user.groups, 'admin')) return next();
  models.Order.findOne(req.params.id, function(err, order) {
    if (err) return logger.db.error(TAGS, 'error trying to find order #' + req.params.id, error), res.error(errors.internal.DB_FAILURE, err);
    if (!order) return res.render('404');
    var reviewToken = req.query.review_token || req.body.review_token;
    if (order.attributes.user_id !== (req.session.user||0).id && order.attributes.review_token !== reviewToken)
      return res.status(404).render('404');
    next();
  });
}

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object
  models.Order.find(req.query, function(error, models) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('orders', {orders: utils.invoke(models, 'toJSON')}, function(err, html) {
      if (err) return res.error(errors.internal.UNKNOWN, error);
      res.send(html);
    });
  });
}

module.exports.get = function(req, res) {
  models.Order.findOne(parseInt(req.params.id), function(error, order) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (!order) return res.status(404).render('404');
    order.getOrderItems(function(err, items) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);

      var review = order.attributes.status === 'submitted' && req.query.review_token === order.attributes.review_token;
      var isOwner = req.session.user && req.session.user.id === order.attributes.user_id;
      utils.findWhere(states, {abbr: order.attributes.state || 'TX'}).default = true;
      var context = {
        order: order.toJSON(),
        restaurantReview: review,
        owner: isOwner,
        admin: req.session.user && utils.contains(req.session.user.groups, 'admin'),
        states: states,
        orderParams: req.session.orderParams
      };

      // orders are always editable for an admin
      if (req.session.user && utils.contains(req.session.user.groups, 'admin'))
        context.order.editable = true;

      var view = 'order';

      if (req.param('receipt')) {
        view = 'invoice/receipt';
        context.layout = 'invoice/invoice-layout';
      }

      res.render(view, context, function(err, html) {
        if (err) return res.error(errors.internal.UNKNOWN, err);
        res.send(html);
      });
    });
  });
}

module.exports.create = function(req, res) {
  var order = new models.Order(utils.extend({user_id: req.session.user.id}, req.body));
  order.save(function(err) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(201, order.toJSON());
  });
}

module.exports.update = function(req, res) {
  var order = new models.Order(utils.extend({id: req.params.id}, req.body));
  order.save(function(err, rows, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(order.toJSON({plain:true}));
  });
}

module.exports.listStatus = function(req, res) {
  models.OrderStatus.find(
    {where: {order_id: req.params.oid},
     order: {created_at: 'desc'}},
    function(err, results) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      res.send(utils.invoke(results, 'toJSON'));
    }
  );
}

module.exports.changeStatus = function(req, res) {
  var TAGS = ['orders-change-status'];
  logger.routes.info(TAGS, 'attempting to change order status for order ' + req.params.oid+' to: '+ req.body.status + ' with review_token: ' + req.body.review_token);

  if (!req.body.status || !utils.has(models.Order.statusFSM, req.body.status))
    return res.send(400, req.body.status + ' is not a valid order status');


  models.Order.findOne(req.params.oid, function(err, order) {
    if (err) return logger.db.error(TAGS, err), res.error(errors.internal.DB_FAILURE, err);
    if (!order) return res.send(404);

    // if they're not an admin, check if the status change is ok.
    if(!req.session.user || !utils.contains(req.session.user.groups, 'admin')) {
      if (!utils.contains(models.Order.statusFSM[order.attributes.status], req.body.status))
        return res.send(403, 'Cannot transition from status '+ order.attributes.status + ' to status ' + req.body.status);

      var review = utils.contains(['accepted', 'denied'], req.body.status);
      if (review && (req.body.review_token !== order.attributes.review_token || order.attributes.token_used != null))
        return res.send(401, 'bad review token');

      if (req.body.status === 'submitted' && !order.isComplete())
        return res.send(403, 'order not complete');

      if (req.body.status === 'submitted' && !order.toJSON().submittable)
        return res.send(403, 'order not submitttable');
    }

    var done = function(status) {
      if (status.attributes.status === 'submitted') {
        var viewOptions = {
          order: order.toJSON({review: true}),
          config: config,
          layout: 'email-layout'
        };

        res.render('email-order-submitted', viewOptions, function(err, html) {
          // TODO: error handling
          utils.sendMail([order.attributes.restaurant.email, config.emails.orders],
                         config.emails.orders,
                         'You have received a new Goodybag order (#' + order.attributes.id+ ')',
                         html);
        });

        if (order.attributes.restaurant.sms_phone) {
          logger.routes.info(TAGS, "shortening url and sending sms for order: " + order.attributes.id);
          var url = config.baseUrl + '/orders/' + order.attributes.id + '?review_token=' + order.attributes.review_token;

          // shorten URL
          bitly.shorten(url, function(err, response) {
            if (err) logger.routes.error(TAGS, 'unable to shorten url, attempting to sms unshortend link', err);
            url = ((response||0).data||0).url || url;
            // send sms
            var msg = 'New Goodybag order for $' + (parseInt(order.attributes.sub_total) / 100).toFixed(2)
            + ' to be delivered on ' + moment(order.attributes.datetime).format('MM/DD/YYYY h:mm a') + '.'
            + '\n' + url;
            twilio.sendSms({
              to: order.attributes.restaurant.sms_phone,
              from: config.phone.orders,
              body: msg
            }, function(err, result) {
              if (err) logger.routes.error(TAGS, 'unabled to send SMS', err);
            });
          });
        }

        if (order.attributes.restaurant.voice_phone) {
          logger.routes.info(TAGS, "making call for order: " + order.attributes.id);

          twilio.makeCall({
            to: order.attributes.restaurant.voice_phone,
            from: config.phone.orders,
            url: config.baseUrl + '/orders/' + order.attributes.id + '/voice',
            ifMachine: 'Continue',
            method: 'GET'
          }, function(err, result) {
            if (err) logger.routes.error(TAGS, 'unabled to place call', err);
          });
        }
      }

      res.send(201, status.toJSON());

      venter.emit('order:status:change', order, status);
    }

    var status = new models.OrderStatus({status: req.body.status, order_id: order.attributes.id});
    status.save(function(err, rows, result) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      if (review) {
        order.attributes.token_used = 'now()';
        order.save(function(err) {
          if (err) return res.error(errors.internal.DB_FAILURE, err);
          done(status);
        });
      }
      else done(status);
    });
  });
};

module.exports.voice = function(req, res, next) {
  models.Order.findOne(parseInt(req.params.oid), function(err, order) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!order) return res.send(404);
    res.render('order-voice', {layout:false, order: order.toJSON()}, function(err, xml) {
      console.log(err);
      if (err) return res.error(errors.internal.UNKNOWN, err);
      res.send(xml);
    });
  });
};

module.exports.receipt = function( req, res ){
  models.Order.findOne( +req.params.oid, function( error, order ){
    if ( error )  return res.error( errors.internal.DB_FAILURE, error );
    if ( !order ) return res.status(404).render('404');

    var options = {
      layout: 'invoice/invoice-layout'
    , order:  order.toJSON()
    };

    res.render( 'invoice/receipt', options );
  });
};