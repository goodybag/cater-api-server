var express = require('express');

var m = require('../../middleware');
var controllers = require('../../controllers');

var route = module.exports = express.Router();

/** The searchable collection of restaurants */

route.get('/',
  m.searchTags(),
  m.localCookies(['gb_display']),
  controllers.restaurants.list);

route.post('/',
  m.restrict('admin'),
  controllers.restaurants.create);

route.all('/', m.restrict(['client', 'admin']), function(req, res, next) {
  res.set('Allow', 'GET, POST');
  res.send(405);
});

/** Individual restaurants */

route.get('/manage',
  m.restrict(['restaurant', 'admin']),
  controllers.restaurants.listManageable);

route.get('/:rid',
  // Just do a barebones lookup since the controller
  // has to do a legacy db model lookup
  m.getRestaurant({ // TODO
    region: false,
    delivery: false,
    items: false,
    amenities: false,
    photos: false
  }),
  controllers.restaurants.orders.current,
  m.exists('order', {
    then: controllers.orders.auth,
    else: m.noop()
  }), // TODO
  m.exists('order', {
    then: m.editOrderAuth,
    else: m.noop()
  }),
  controllers.restaurants.get);

route.put('/:rid', m.restrict('admin'), controllers.restaurants.update);

route.patch('/:rid', m.restrict('admin'), controllers.restaurants.update);

route.delete('/:rid', m.restrict('admin'), controllers.restaurants.remove);

route.all('/:rid', m.restrict(['client', 'admin']), function(req, res, next) {
  res.set('Allow', 'GET, PUT, PATCH, DELETE');
  res.send(405);
});

/**
 * Restaurant items resource.  The collection of all items belonging to a restaurant.
 */

route.get('/:rid/items', m.restrict(['client', 'admin']), controllers.restaurants.listItems); // not currently used

route.all('/:rid/items', m.restrict(['client', 'admin']), function(req, res, next) {
  res.set('Allow', 'GET');
  res.send(405);
});

/**
 * Restaurant events resource.
 */

route.get('/:rid/events', m.restrict(['admin']), controllers.restaurants.events.list);

route.post('/:rid/events', m.restrict(['admin']), controllers.restaurants.events.create);

route.all('/:rid/events', m.restrict(['admin']), function(req, res, next) {
  res.set('Allow', 'GET, POST');
  res.send(405);
});

/**
 * Individual restaurant event resource.
 */

route.put('/:rid/events/:eid', m.restrict(['admin']), controllers.restaurants.events.update);

route.patch('/:rid/events/:eid', m.restrict(['admin']), controllers.restaurants.events.update);

route.delete('/:rid/events/:eid', m.restrict(['admin']), controllers.restaurants.events.remove);

route.all('/:rid/events/:eid', m.restrict(['admin']), function(req, res, next) {
  res.set('Allow', 'PUT', 'PATCH, DELETE');
  res.send(405);
});

/**
 * Restaurant categories resource.  The collection of all categories belonging to a restaurant.
 */

route.get('/:rid/categories', m.restrict(['client', 'admin']), controllers.restaurants.categories.list); // not currently used

route.post('/:rid/categories', m.restrict('admin'), controllers.restaurants.categories.create);

route.all('/:rid/categories', m.restrict(['client', 'admin']), function(req, res, next) {
  res.set('Allow', 'GET, POST');
  res.send(405);
});

/**
 * Individual category resource.  A single restaurant category.
 */

route.get('/:rid/categories/:cid', m.restrict(['client', 'admin']), controllers.restaurants.categories.get); // not currently used

route.put('/:rid/categories/:cid', m.restrict('admin'), controllers.restaurants.categories.update);

route.patch('/:rid/categories/:cid', m.restrict('admin'), controllers.restaurants.categories.update);

route.delete('/:rid/categories/:cid', m.restrict('admin'), controllers.restaurants.categories.remove);

route.all('/:rid/categories/:cid', m.restrict(['client', 'admin']), function(req, res, next) {
  res.set('Allow', 'GET, PUT, PATCH, DELETE');
  res.send(405);
});

/**
 *  Category items resource.  The collection of all items belonging to a single category.
 */

route.get('/:rid/categories/:cid/items', m.restrict(['client', 'admin']), controllers.restaurants.categories.listItems); // not currently used

route.post('/:rid/categories/:cid/items', m.restrict('admin'), controllers.restaurants.categories.addItem);

route.all('/:rid/categories/:cid/items', m.restrict(['client', 'admin']), function(req, res, next) {
  res.set('Allow', 'GET, POST');
  res.send(405);
});

/**
 *  Restaurant orders resource.  The collection of all orders belonging to a single restaurant.
 */

route.post('/:rid/orders', m.restrict(['client', 'admin']), function(req, res, next) {
  req.body.restaurant_id = req.params.rid;
  req.url = '/orders';
  next();
});

route.all('/:rid/orders', m.restrict(['client', 'admin']), function(req, res, next) {
  res.set('Allow', 'GET, POST');
  res.send(405);
});

/**
 *  Current order resource.  The current pending order for the given restaurant and logged in user.
 */

route.all('/:rid/orders/current(/*)?', m.restrict(['client', 'admin']), controllers.restaurants.orders.current);

/**
 * Restaurant Sign Up
 */
route.post('/api/restaurants/join', controllers.restaurants.signups.create);

route.put('/api/restaurants/join'
, function (req, res, next) {
    var signupId = req.session.restaurant_signup_id;
    if (!signupId) {
      return console.log('invalid signup id'), res.status(400).send();
    }

    req.queryObj = { id: signupId };
    req.queryOptions.returning = ['id', 'status', 'data'];

    next();
  }
, controllers.restaurants.signups.update
);

route.get('/restaurants/join'
, m.states()
, m.localCookies(['gb_rs'])
, function (req, res, next) {
    res.locals.restaurant = {};
    res.locals.signup = {};
    var signupId = req.session.restaurant_signup_id;
    if (!signupId) return next();

    db.restaurant_signups.findOne({ id: signupId }, function (error, results) {
      if (error) return next();

      if (results) {
        res.locals.restaurant = results.data;
        res.locals.signup = { id: results.id, step: results.step.toString() };
      }

      next();
    });
  }
, m.view('restaurant-signup', {
    layout: 'layout/default'
  })
);