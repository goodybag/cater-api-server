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
  m.exists('order', {then: controllers.orders.auth, else: m.noop()}), // TODO
  m.exists('order', {then: m.editOrderAuth, else: m.noop()}),
  controllers.restaurants.get);

route.put('/:rid', m.restrict('admin'), controllers.restaurants.update);

route.patch('/:rid', m.restrict('admin'), controllers.restaurants.update);

route.delete('/:rid', m.restrict('admin'), controllers.restaurants.remove);

route.all('/:rid', m.restrict(['client', 'admin']), function(req, res, next) {
  res.set('Allow', 'GET, PUT, PATCH, DELETE');
  res.send(405);
});
