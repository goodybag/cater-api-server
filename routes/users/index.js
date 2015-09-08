var express = require('express');

var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');
var Models = require('../../models');

var User = Models.User;

var route = module.exports = express.Router();

/**
 *  Users resource.  All the users.
 */

route.get('/', m.restrict('admin'), m.db.restaurants.find({}, {
  limit: 'all'
}), m.queryOptions({
  limit: 'all',
  order: 'id desc',
  one: [{
    table: 'regions',
    alias: 'region'
  }]
}), m.view('users', db.users, {
  method: 'find'
}));

route.post('/', m.restrict('admin'), controllers.admin.users.create, controllers.admin.users.handleError);

route.all('/', function(req, res, next) {
  res.set('Allow', 'GET, POST');
  res.send(405);
});

/**
 * User return resource. Restore admin session after impersonating another user.
 * Placed higher in the stack so 'client' users can access this route
 */

route.get('/return', controllers.users.returnSession);

route.all('/return', function(req, res, next) {
  res.set('Allow', 'GET');
  res.send(405);
});

/**
 *  Current user resource.
 */

var restrictOwner = m.owner();

route.param('uid', function(req, res, next, id) {
  if (id === 'me') {
    if (!req.user) {
      restrictOwner(req, res, next);
    } else {
      if (req.user.attributes.groups.indexOf('guest') > -1) {
        return restrictOwner(req, res, next);
      }

      req.params.uid = req.user.attributes.id;
      next();
    }
  } else {
    next();
  }
});

route.get('/:uid', restrictOwner, controllers.users.get);

var restrictUpdate = m.filterBody({
  client: User.ownerWritable
});

route.put('/:uid', restrictOwner, restrictUpdate, m.updateStripeCustomer({
  required: 'user',
  pick: ['name']
}), controllers.users.update);

route.patch('/:uid', restrictOwner, restrictUpdate, m.updateStripeCustomer({
  required: 'user',
  pick: ['name']
}), controllers.users.update);

route.delete('/:uid', function(req, res) {
  res.send(501);
});

route.all('/:uid', restrictOwner, function(req, res, next) {
  res.set('Allow', 'GET, PUT, DELETE');
  res.send(405);
});

/**
 *  User Orders resource.  All the orders placed by an individual user.
 */

route.get('/:uid/orders', restrictOwner
  // , m.pagination({ pageParam: 'p' }) // todo: paging set up for users orders
  , m.param('uid', function(user_id, $query, options) {
    $query.where = $query.where || {};
    $query.where.user_id = user_id;
  }), m.param('status'), m.param('type'), m.sort('-id'), m.queryOptions({
    one: [{
      table: 'restaurants',
      alias: 'restaurant'
    }, {
      table: 'users',
      alias: 'user'
    }],
    submittedDate: true
  }),
  function(req, res, next) {
    res.locals.status = req.params.status;
    if (req.params.status == 'accepted') {
      req.queryOptions.statusDateSort = {
        status: req.params.status
      };
    }
    return next();
  }, m.view('user-orders', db.orders)
);

route.get('/:uid/orders/receipts', restrictOwner, m.param('uid', function(user_id, $query, options) {
  $query.where = $query.where || {};
  $query.where.user_id = user_id;
}), m.param('status', 'accepted'), m.sort('-datetime'), m.queryOptions({
  one: [{
    table: 'restaurants',
    alias: 'restaurant'
  }, {
    table: 'users',
    alias: 'user'
  }]
}), m.view('user-receipts', db.orders, {
  layout: 'layout/default'
}));

route.all('/:uid', restrictOwner, function(req, res, next) {
  res.set('Allow', 'GET');
  res.send(405);
});

/**
 * Loyalty
 */

route.get('/:uid/rewards', restrictOwner, controllers.users.rewards.list);

/**
 *  User Addresseses resource.
 */

route.get('/:uid/addresses', restrictOwner, controllers.users.addresses.list);

route.post('/:uid/addresses', restrictOwner, controllers.users.addresses.create);


route.all('/:uid/addresses', restrictOwner, function(req, res, next) {
  res.set('Allow', 'GET', 'POST');
  res.send(405);
});

/**
 * User Address resource. Represents a single address per user
 */

route.get('/:uid/addresses/:aid', restrictOwner, controllers.users.addresses.get);

route.put('/:uid/addresses/:aid', restrictOwner, controllers.users.addresses.update);

route.patch('/:uid/addresses/:aid', restrictOwner, controllers.users.addresses.update);

route.delete('/:uid/addresses/:aid', restrictOwner, controllers.users.addresses.remove);

route.all('/:uid/addresses/:aid', restrictOwner, function(req, res, next) {
  res.set('Allow', 'GET', 'PUT', 'PATCH', 'DELETE');
  res.send(405);
});

/**
 * User cards resource
 */

route.get('/:uid/cards', restrictOwner, controllers.users.cards.list);

route.post('/:uid/cards', restrictOwner, controllers.users.cards.create);

route.get('/:uid/cards/:cid', restrictOwner, controllers.users.cards.get);

route.put('/:uid/cards/:cid', restrictOwner, controllers.users.cards.update);

route.patch('/:uid/cards/:cid', restrictOwner, controllers.users.cards.update);

route.delete('/:uid/cards/:cid', restrictOwner, controllers.users.cards.remove);

route.all('/:uid/cards/:cid', restrictOwner, function(req, res, next) {
  res.set('Allow', 'GET', 'PUT', 'PATCH', 'DELETE');
  res.send(405);
});

/**
 *  User session resource.  Represents a session as a specific user.
 */

route.get('/:uid/session', restrictOwner, controllers.users.createSessionAs);

route.post('/:uid/session', restrictOwner, controllers.users.createSessionAs);

route.all('/:uid/session', restrictOwner, function(req, res, next) {
  res.set('Allow', 'GET', 'POST');
  res.send(405);
});
