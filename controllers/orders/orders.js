var db      = require('../../db');
var errors  = require('../../errors');
var utils   = require('../../utils');
var config  = require('../../config');
var states  = require('../../public/js/lib/states')
var models  = require('../../models');
var logger  = require('../../logger');
var receipt = require('../../lib/receipt');
var venter  = require('../../lib/venter');

var moment = require('moment');
var twilio = require('twilio')(config.twilio.account, config.twilio.token);
var Mailgun = require('mailgun').Mailgun;
var MailComposer = require('mailcomposer').MailComposer;

var Bitly = require('bitly');
var bitly = new Bitly(config.bitly.username, config.bitly.apiKey);

var addressFields = [
  'street'
, 'street2'
, 'city'
, 'state'
, 'zip'
, 'phone'
, 'delivery_instructions'
];

/**
 * Will attach req.order.[isOwner, isRestaurantManager, isAdmin] to help determine
 * what control the user has over a particular order
 */
module.exports.auth = function(req, res, next) {
  var TAGS = ['orders-auth'];
  req.order = {};
  logger.db.info(TAGS, 'auth for order #'+ req.params.id);
  if (req.session.user != null && utils.contains(req.session.user.groups, 'admin')) {
    req.order.isAdmin = true;
    return next();
  }
  models.Order.findOne(req.params.id, function(err, order) {
    if (err) return logger.db.error(TAGS, 'error trying to find order #' + req.params.id, err), res.error(errors.internal.DB_FAILURE, err);
    if (!order) return res.render('404');
    var reviewToken = req.query.review_token || req.body.review_token;

    // allow restaurant user to view orders at their own restaurant
    if (req.user
      && req.user.attributes.restaurant_ids
      && utils.contains(req.user.attributes.restaurant_ids, order.attributes.restaurant_id)
    ) {
      req.order.isRestaurantManager = true;
      return next();
    }

    if (order.attributes.user_id !== (req.session.user||0).id && order.attributes.review_token !== reviewToken)
      return res.status(404).render('404');

    req.order.isOwner = true;
    next();
  });
};

module.exports.editability = function(req, res, next) {
  models.Order.findOne(req.params.oid, function(err, order) {
    if (err) return res.error(errors.internal.DB_FAILURE);
    if (!order) return res.json(404);

    // client making a tip edit, ensure only tip fields are being adjusted
    var isTipEdit = req.order.isOwner && !utils.difference(utils.keys(req.body), ['tip', 'tip_percent']).length;

    var editable = isTipEdit || req.order.isRestaurantManager || req.order.isAdmin || utils.contains(['pending', 'submitted'], order.attributes.status);
    return editable ? next() : res.json(403, 'order not editable');
  });
};

module.exports.list = function(req, res) {
  var filter = utils.contains(models.Order.statuses, req.query.filter) ? req.query.filter : 'all';
  models.Order.findByStatus(filter, function( error, orders ) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    var context = {
      orders: utils.invoke(orders, 'toJSON')
    , filter: filter
    };
    res.render('orders', context);
  });
};

// module.exports.get = function(req, res) {
//   models.Order.findOne(parseInt(req.params.oid), function(error, order) {
//     if (error) return res.error(errors.internal.DB_FAILURE, error);
//     if (!order) return res.status(404).render('404');
//     order.getOrderItems(function(err, items) {
//       if (err) return res.error(errors.internal.DB_FAILURE, err);

//       var review = order.attributes.status === 'submitted' && req.query.review_token === order.attributes.review_token;
//       var isOwner = req.session.user && req.session.user.id === order.attributes.user_id;
//       utils.findWhere(states, {abbr: order.attributes.state || 'TX'}).default = true;
//       var context = {
//         order: order.toJSON(),
//         restaurantReview: review,
//         owner: isOwner,
//         admin: req.session.user && utils.contains(req.session.user.groups, 'admin'),
//         states: states,
//         orderParams: req.session.orderParams,
//         query: req.query
//       };

//       // orders are always editable for an admin
//       if (req.session.user && utils.contains(req.session.user.groups, 'admin'))
//         context.order.editable = true;

//       res.render('order', context, function(err, html) {
//         if (err) return res.error(errors.internal.UNKNOWN, err);
//         res.send(html);
//       });
//     });
//   });
// }

module.exports.get = function(req, res) {
  var tasks = [
    function(cb) {
      var query = {
        columns: ['*', 'submitted_date']
      , where: { id: parseInt(req.params.oid) }
      };
      models.Order.findOne(query, function(err, order) {
        if (err) return cb(err);
        if (!order) return cb(404);
        return cb(null, order);
      });
    },

    function(order, cb) {
      order.getOrderItems(function(err, items) {
        return cb(err, order);
      });
    },

    function(order, cb) {
      var query = {
        where: { id: order.attributes.user_id },
        embeds: {
          payment_methods: {}
        , addresses: {
            order: ['is_default desc', 'id asc']
          , where: { user_id: order.attributes.user_id }
          // Actually, we can probably just display this restriction client-side
          // , where: {
          //     zip: { $in: order.attributes.restaurant.delivery_zips }
          //   }
          }
        }
      };

      models.User.find(query, function(err, results) {
        if (err) return cb(err);

        return cb(null, order, results[0]);
      });
    }
  ];

  utils.async.waterfall(tasks, function(err, order, user) {
    if (err)
      return err === 404 ? res.status(404).render('404') : res.error(errors.internal.DB_FAILURE, err);

    // Redirect empty orders to item summary
    if (!order.orderItems.length) return res.redirect(302, '/orders/' + req.params.oid + '/items');

    var isReview = order.attributes.status === 'submitted'
      && (req.query.review_token === order.attributes.review_token || req.order.isRestaurantManager)
    ;

    user = user.toJSON();
    user.addresses = utils.invoke(user.addresses, 'toJSON');

    utils.findWhere(states, {abbr: order.attributes.state || 'TX'}).default = true;
    var context = {
      order: order.toJSON(),
      isRestaurantReview: isReview,
      isOwner: req.order.isOwner,
      isRestaurantManager: req.order.isRestaurantManager,
      isAdmin: req.order.isAdmin,
      isTipEditable: order.isTipEditable({
        isOwner: req.order.isOwner,
        isRestaurantManager: req.order.isRestaurantManager,
        isAdmin: req.order.isAdmin,
      }),
      states: states,
      orderAddress: function() {
        return {
          address: order.toJSON(),
          states: states
        };
      },
      orderParams: req.session.orderParams,
      query: req.query,
      user: user,
      step: order.attributes.status === 'pending' ? 2 : 3
    };

    // Put address grouped on order for convenience
    context.order.address = utils.pick(
      context.order,
      ['street', 'street2', 'city', 'state', 'zip', 'phone', 'notes']
    );

    // Embed the payment_method if we can
    if (context.order.payment_method_id){
      context.order.payment_method = utils.findWhere(
        context.user.payment_methods, { id: context.order.payment_method_id }
      );
    }

    // Decide where to show the `Thanks` message
    if (moment(context.order.submitted_date).add('hours', 1) > moment())
    if (req.session && req.session.user)
    if (context.order.user_id == req.session.user.id){
      context.showThankYou = true;
    }

    // don't allow restaurant manager to edit orders
    // in the future we will/should support this
    if (req.order.isRestaurantManager)
      context.order.editable = false;

    // orders are always editable for an admin
    if (req.order.isAdmin)
      context.order.editable = true;

    var view = order.attributes.status === 'pending' ? 'checkout' : 'receipt';

    if (req.param('receipt')) {
      view = 'invoice/receipt';
      context.layout = 'invoice/invoice-layout';
    }

    res.render(view, context);
  });

}

module.exports.create = function(req, res) {
  var order = new models.Order(utils.extend({user_id: req.session.user.id}, req.body));
  order.save(function(err) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(201, order.toJSON());
  });
}

// TODO: get this from not here
var updateableFields = ['street', 'street2', 'city', 'state', 'zip', 'phone', 'notes', 'datetime', 'timezone', 'guests', 'adjustment', 'tip', 'tip_percent', 'name', 'delivery_instructions', 'payment_method_id', 'reason_denied', 'reviewed'];
var restaurantUpdateableFields = ['tip', 'tip_percent', 'reason_denied'];

module.exports.update = function(req, res) {
  models.Order.findOne(req.params.oid, function(err, order) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (req.order.isRestaurantManager) updateableFields = restaurantUpdateableFields;

    var isTipEditable = order.isTipEditable({
      isOwner: req.order.isOwner,
      isRestaurantManager: req.order.isRestaurantManager,
      isAdmin: req.order.isAdmin,
    });
    if (!isTipEditable) updateableFields = utils.without(updateableFields, 'tip', 'tip_percent');

    utils.extend(order.attributes, utils.pick(req.body, updateableFields));
    order.save(function(err, rows, result) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      res.send(order.toJSON({plain:true}));
    });
  });
};

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

    var previousStatus = order.attributes.status;

    // if they're not an admin, check if the status change is ok.
    if(!req.session.user || (!req.order.isRestaurantManager && !req.order.isAdmin)) {
      if (!utils.contains(models.Order.statusFSM[order.attributes.status], req.body.status))
        return res.send(403, 'Cannot transition from status '+ order.attributes.status + ' to status ' + req.body.status);

      var review = utils.contains(['accepted', 'denied'], req.body.status);
      if (review && (req.body.review_token !== order.attributes.review_token || order.attributes.token_used != null))
        return res.send(401, 'bad review token');

      if (req.body.status === 'submitted' && !order.isComplete())
        return res.send(403, 'order not complete');

      if (req.body.status === 'submitted' && !order.toJSON().submittable)
        return res.send(403, 'order not submittable');
    }

    var done = function() {
      if (order.attributes.status === 'submitted') {

        // TODO: extract this address logic into address model
        // Save address based on this order's attributes
        var orderAddressFields = utils.pick(order.attributes, addressFields);

        // Set `is_default == true` if there's no default set
        models.Address.find({ where: {user_id: req.session.user.id, is_default: true}}, function(error, addresses) {
          if (error) return res.error(errors.internal.DB_FAILURE, error);

          var noExistingDefault = !addresses.length;
          var addressData = utils.extend(orderAddressFields, { user_id: req.session.user.id, is_default: noExistingDefault });
          var address = new models.Address(addressData);
          address.save(function(err, rows, result) {

            // Db enforces unique addresses, so ignore 23505 UNIQUE VIOLATION
            if (err && err.code !== '23505') return res.error(errors.internal.DB_FAILURE, err);
          });
        });

        if (order.attributes.restaurant.sms_phones) {
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
            utils.each(order.attributes.restaurant.sms_phones, function(sms_phone) {
              twilio.sendSms({
                to: sms_phone,
                from: config.phone.orders,
                body: msg
              }, function(err, result) {
                if (err) logger.routes.error(TAGS, 'unable to send SMS', err);
              });
            });
          });
        }

        if (order.attributes.restaurant.voice_phones) {
          logger.routes.info(TAGS, "making call for order: " + order.attributes.id);

          utils.each(order.attributes.restaurant.voice_phones, function(voice_phone) {
            twilio.makeCall({
              to: voice_phone,
              from: config.phone.orders,
              url: config.baseUrl + '/orders/' + order.attributes.id + '/voice',
              ifMachine: 'Continue',
              method: 'GET'
            }, function(err, result) {
              if (err) logger.routes.error(TAGS, 'unable to place call', err);
            });
          });
        }
      }

      res.send(201, {order_id: order.attributes.id, status: order.attributes.status});

      // If we are an admin and we received a ?notify=false then don't send notifications.
      // Otherwise send the notification.
      if (!(req.session.user
        && req.order.isAdmin
        && req.query.notify
        && req.query.notify.toLowerCase() == 'false'
      )) venter.emit('order:status:change', order, previousStatus);
    }

    if (req.body.status === 'submitted' && order.attributes.user.is_invoiced) order.attributes.payment_status = 'invoiced';

    if (review) order.attributes.token_used = 'now()';

    order.attributes.status = req.body.status;

    order.save(function(err){
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      return done();
    });
  });
};

module.exports.voice = function(req, res, next) {
  models.Order.findOne(parseInt(req.params.oid), function(err, order) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!order) return res.send(404);
    res.render('order-voice', {layout:false, order: order.toJSON()}, function(err, xml) {
      if (err) return res.error(errors.internal.UNKNOWN, err);
      res.send(xml);
    });
  });
};

module.exports.duplicate = function(req, res, next) {
  var oldOrder = new models.Order({id: req.params.oid});
  oldOrder.createCopy(function(err, newOrder, lostItems) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (newOrder == null) return res.json(404);
    var obj = newOrder.toJSON();
    obj.lostItems = lostItems;
    res.json(201, obj);
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
