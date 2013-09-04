var db = require('../../db');
var errors = require('../../errors');
var utils = require('../../utils');
var config = require('../../config');
var states = require('../../public/states');
var models = require('../../models');
var Mailgun = require('mailgun').Mailgun;
var MailComposer = require('mailcomposer').MailComposer
var twilio = require('twilio')(config.twilio.account, config.twilio.token);
var moment = require('moment');

module.exports.auth = function(req, res, next) {
  if (req.session.user != null && utils.contains(req.session.user.groups, 'admin'))
    return next();
  models.Order.findOne(req.params.id, function(err, order) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    var reviewToken = req.query.review_token || req.body.review_token;
    if (order.attributes.user_id !== (req.session.user||0).id && order.attributes.review_token !== reviewToken)
      return res.send(404);
    next();
  });
}

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object
  models.Order.find(req.query, function(error, models) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(utils.invoke(models, 'toJSON'));
  });
}

module.exports.get = function(req, res) {
  models.Order.findOne(parseInt(req.params.id), function(error, order) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (!order) return res.send(404);
    order.getOrderItems(function(err, items) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);

      var review = order.attributes.status === 'submitted' && req.query.review_token === order.attributes.review_token;
      var isOwner = req.session.user && req.session.user.id === order.attributes.user_id;
      utils.findWhere(states, {abbr: order.attributes.state || 'TX'}).default = true;
      var context = {
        order: order.toJSON(),
        restaurantReview: review,
        owner: isOwner,
        states: states,
        orderParams: req.session.orderParams
      };
      res.render('order', context, function(err, html) {
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
    res.send(order.toJSON());
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
  if (!req.body.status || !utils.has(models.Order.statusFSM, req.body.status))
    return res.send(400, req.body.status + ' is not a valid order status');

  models.Order.findOne(req.params.oid, function(err, order) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!order) return res.send(404);
    if (!utils.contains(models.Order.statusFSM[order.attributes.status], req.body.status))
      return res.send(403, 'Cannot transition from status '+ order.attributes.status + ' to status ' + req.body.status);

    var review = utils.contains(['accepted', 'denied'], req.body.status);
    if (review && (req.body.review_token !== order.attributes.review_token || order.attributes.token_used == null))
      return res.send(401, 'bad review token');

    if (req.body.status === 'submitted' && !order.isComplete())
      return res.send(403, 'order not complete');

    var done = function(status) {
      if (status.attributes.status === 'submitted') {
        res.render('order-submitted-email', {order: order.toJSON({review: true}), config: config, layout: false}, function(err, html) {
          // TODO: error handling
          utils.sendMail(order.attributes.restaurant.email, 'orders@goodybag.com', 'You have received a new Goodybag order.', html);
        });
        if (order.attributes.restaurant.sms_phone) {
          var msg = 'You have received a new Goodybag order for $' + order.attributes.sub_total.toFixed(2)
          + ' to be delivered on ' + moment(order.attributes.datetime).format('MM/DD/YYYY HH:mm a') + '.'
          + '\n' + config.baseUrl + '/orders/' + order.attributes.id + '?review_token=' + order.attributes.review_token
          twilio.sendSms({
            to: order.attributes.restaurant.sms_phone,
            from: config.phone.orders,
            body: msg
          }, function(err, result) { /* TODO: error handling */ });
        }
      }

      if (utils.contains(['submitted', 'accepted', 'denied', 'delivered'], status.attributes.status)) {
        res.render('order-status-change-email', {layout: false, status: status.toJSON(), config: config, order: order.toJSON()}, function(err, html) {
          //TODO: error handling
          utils.sendMail(req.session.user.email, 'orders@goodybag.com', 'Your Goodybag order has been ' + status.attributes.status + '.', html);
        });
      }
      res.send(201, status.toJSON());
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
}
