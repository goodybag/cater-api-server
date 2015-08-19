var express = require('express');

var m = require('../../middleware');
var controllers = require('../../controllers');

var route = module.exports = express.Router();

/**
 *  Items resource.  The collection of all items.
 */

route.get('/', m.restrict(['client', 'admin']), controllers.items.list);  // not currently used

route.all('/', m.restrict(['client', 'admin']), function(req, res, next) {
  res.set('Allow', 'GET');
  res.send(405);
});

/**
 *  Item resource.  An individual item.
 */

route.get('/:id', m.restrict(['client', 'admin']), controllers.items.get);  // not currently used

route.put('/:id', m.restrict('admin'), controllers.items.update);

route.patch('/:id', m.restrict('admin'), controllers.items.update);

route.delete('/:id', m.restrict('admin'), controllers.items.remove);

route.all('/:id', m.restrict(['client', 'admin']), function(req, res, next) {
  res.set('Allow', 'GET, PUT, PATCH,  DELETE');
  res.send(405);
});
