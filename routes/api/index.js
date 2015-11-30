var express = require('express');

var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');

var route = module.exports = express.Router();

route.use('/restaurants', require('./restaurants'));
route.use('/orders', require('./orders'));
route.use('/amenities', require('./amenities'));
route.use('/invoices', require('./invoices'));
route.use('/payments', require('./payments'));

/**
 * Users
 */

route.post('/users/:uid/rewards'
, m.restrict(['admin', 'client'])
, m.owner()
, controllers.users.rewards.redeem
);

route.get('/users'
, m.restrict(['admin'])
, m.sort('-id')
, m.queryOptions({
    many: [{ table: 'addresses' }, { table: 'orders' }]
  })
, m.find( db.users )
);

route.get('/users/me'
, function( req, res ){
    delete req.user.attributes.password;
    res.json( req.user );
  }
);

route.get('/users/:id'
, m.restrict(['admin'])
, m.param('id')
, m.sort('-id')
, m.queryOptions({
    many: [
      { table: 'addresses' }
    , { table: 'users_groups', alias: 'groups' }
    ]
  })
, m.find( db.users )
);

route.put('/users/:id'
, m.restrict(['admin'])
, m.param('id')
, m.updateStripeCustomer({ required: 'user', pick: ['name'] })
, m.update( db.users )
);

route.delete('/users/:id'
, m.restrict(['admin'])
, m.param('id')
, m.remove( db.users )
);

// req body: { name: User Name, email: example@email.com }
route.post('/users/:user_id/invoice-recipients'
, m.restrict(['admin'])
, m.queryToBody('user_id')
, m.insert( db.user_invoice_recipients )
);

// req body: { email: example@email.com }
route.put('/users/invoice-recipients/:id'
, m.restrict(['admin'])
, m.param('id')
, m.update( db.user_invoice_recipients )
);

route.delete('/users/invoice-recipients/:id'
, m.restrict(['admin'])
, m.param('id')
, m.remove( db.user_invoice_recipients )
);

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
