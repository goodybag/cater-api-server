var express = require('express');

var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');

var route = module.exports = express.Router();

route.use('/restaurants', require('./restaurants'));
route.use('/restaurant-plans', require('./restaurant-plans'));
route.use('/orders', require('./orders'));
route.use('/amenities', require('./amenities'));
route.use('/invoices', require('./invoices'));
route.use('/payments', require('./payments'));
route.use('/features', require('./features'));
route.use('/users', require('./users'));
route.use('/promos', require('./promos'));


/**
 * Delivery Services
 */

route.get('/delivery-services'
, m.restrict(['admin'])
, m.sort('-id')
, m.param('region_id')
, m.queryOptions({
    many: [{ table: 'delivery_service_zips', alias: 'zips' }]
  , one:  [{ table: 'regions', alias: 'region' }]
  })
, m.find( db.delivery_services )
);

route.post('/delivery-services'
, m.restrict(['admin'])
, m.insert( db.delivery_services )
);

route.get('/delivery-services/:id'
, m.restrict(['admin'])
, m.param('id')
, m.findOne( db.delivery_services )
);

route.put('/delivery-services/:id'
, m.restrict(['admin'])
, m.param('id')
, m.update( db.delivery_services )
);

route.delete('/delivery-services/:id'
, m.restrict(['admin'])
, m.param('id')
, m.remove( db.delivery_services )
);

/**
 * Maps
 */

route.get('/maps/geocode/:address'
, controllers.api.maps.geocode
);

route.get('/stripe-events/:id'
, m.restrict(['admin'])
, m.stripe.getStripeEvent()
);
